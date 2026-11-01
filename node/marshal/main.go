package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
)

type managedProcess struct {
	cmd  *exec.Cmd
	done chan struct{}
	stop sync.Once
}
type processRegistry struct {
	sync.Mutex
	procs map[int]*managedProcess
}
type app struct {
	config   Config
	logs     *logs
	registry processRegistry
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
func readJSON(r *http.Request, dst any) error {
	if r.Method != "POST" {
		return fmt.Errorf("POST required")
	}
	d := json.NewDecoder(io.LimitReader(r.Body, 65537))
	if e := d.Decode(dst); e != nil {
		return e
	}
	var extra any
	if e := d.Decode(&extra); e != io.EOF {
		return fmt.Errorf("expected one JSON object")
	}
	return nil
}
func projectPath(p string) (string, error) {
	if !filepath.IsAbs(p) {
		return "", fmt.Errorf("project path must be absolute")
	}
	p, e := filepath.EvalSymlinks(p)
	if e != nil {
		return "", e
	}
	s, e := os.Stat(p)
	if e != nil {
		return "", e
	}
	if !s.IsDir() {
		return "", fmt.Errorf("project path must be a directory")
	}
	return p, nil
}
func entryPath(root, p string) (string, error) {
	if p == "" {
		return "", fmt.Errorf("entry required")
	}
	if !filepath.IsAbs(p) {
		p = filepath.Join(root, p)
	}
	p, e := filepath.EvalSymlinks(p)
	if e != nil {
		return "", e
	}
	rel, e := filepath.Rel(root, p)
	if e != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) {
		return "", fmt.Errorf("entry must be within project")
	}
	s, e := os.Stat(p)
	if e != nil {
		return "", e
	}
	if !s.Mode().IsRegular() {
		return "", fmt.Errorf("entry must be a regular file")
	}
	return p, nil
}
func resolve(p string) (string, error) {
	if e := executableName(p); e != nil {
		return "", e
	}
	return exec.LookPath(p)
}
func (c Config) runtime(language string) (string, error) {
	switch language {
	case "python":
		return c.Runtimes.Python, nil
	case "node":
		return c.Runtimes.Node, nil
	case "go":
		return c.Runtimes.Go, nil
	case "bash":
		return c.Runtimes.Bash, nil
	case "react":
		return c.Runtimes.React, nil
	}
	return "", fmt.Errorf("unsupported language")
}
func (c Config) editor(language string) string {
	if p := c.Editors.ByLanguage[language]; p != "" {
		return p
	}
	return c.Editors.Default
}
func (a *app) command(root, entry, language string) (*exec.Cmd, error) {
	runtime, e := a.config.runtime(language)
	if e != nil {
		return nil, e
	}
	exe, e := resolve(runtime)
	if e != nil {
		return nil, e
	}
	var args []string
	if language == "react" {
		vite, e := entryPath(root, "node_modules/.bin/vite")
		if e != nil {
			return nil, e
		}
		cfg, e := entryPath(root, "vite.config.js")
		if e != nil {
			return nil, e
		}
		args = []string{vite, "--config", cfg}
	} else {
		entry, e = entryPath(root, entry)
		if e != nil {
			return nil, e
		}
		args = []string{entry}
		if language == "go" {
			args = []string{"run", entry}
		}
	}
	cmd := exec.Command(exe, args...)
	cmd.Dir = root
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	return cmd, nil
}
func (a *app) start(id int, cmd *exec.Cmd) (*managedProcess, error) {
	a.registry.Lock()
	defer a.registry.Unlock()
	if _, ok := a.registry.procs[id]; ok {
		return nil, fmt.Errorf("project already running")
	}
	if len(a.registry.procs) >= a.config.Process.MaxRunning {
		return nil, fmt.Errorf("maximum running processes reached")
	}
	var f *rotatingWriter
	cmd.WaitDelay = time.Second
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard
	if a.config.Logging.Enabled {
		var e error
		f, e = newWriter(a.config.Logging, fmt.Sprintf("project_%d-%d.log", id, time.Now().UnixNano()))
		if e != nil {
			return nil, e
		}
		cmd.Stdout = reportWriter{f}
		cmd.Stderr = reportWriter{f}
	}
	if e := cmd.Start(); e != nil {
		if f != nil {
			_ = f.Close()
		}
		return nil, e
	}
	p := &managedProcess{cmd: cmd, done: make(chan struct{})}
	a.registry.procs[id] = p
	go func() {
		e := cmd.Wait() // Wait also joins stdout/stderr copy goroutines.
		_ = syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
		if f != nil {
			if err := f.Close(); err != nil {
				fmt.Fprintln(os.Stderr, err)
			}
		}
		a.logs.spawn.Info("process exited", "project_id", id, "error", e)
		a.registry.Lock()
		delete(a.registry.procs, id)
		close(p.done)
		a.registry.Unlock()
	}()
	return p, nil
}
func (a *app) terminate(p *managedProcess) {
	p.stop.Do(func() {
		select {
		case <-p.done:
			return
		default:
		}
		_ = syscall.Kill(-p.cmd.Process.Pid, syscall.SIGTERM)
		timer := time.NewTimer(time.Duration(a.config.Process.GracefulShutdownSeconds) * time.Second)
		defer timer.Stop()
		select {
		case <-p.done:
			return
		case <-timer.C:
			_ = syscall.Kill(-p.cmd.Process.Pid, syscall.SIGKILL)
		}
		<-p.done
	})
}
func (a *app) handleSpawn(w http.ResponseWriter, r *http.Request) {
	var b struct {
		ProjectID int    `json:"project_id"`
		Path      string `json:"path"`
		Entry     string `json:"entry"`
		Language  string `json:"language"`
	}
	if readJSON(r, &b) != nil || b.ProjectID <= 0 {
		writeJSON(w, 400, map[string]string{"error": "invalid body"})
		return
	}
	root, e := projectPath(b.Path)
	if e != nil {
		writeJSON(w, 400, map[string]string{"error": e.Error()})
		return
	}
	cmd, e := a.command(root, b.Entry, b.Language)
	if e != nil {
		writeJSON(w, 400, map[string]string{"error": e.Error()})
		return
	}
	p, e := a.start(b.ProjectID, cmd)
	if e != nil {
		writeJSON(w, 500, map[string]string{"error": e.Error()})
		return
	}
	a.logs.spawn.Info("process started", "project_id", b.ProjectID, "pid", p.cmd.Process.Pid)
	writeJSON(w, 200, map[string]any{"success": true, "pid": p.cmd.Process.Pid})
}
func (a *app) handleKill(w http.ResponseWriter, r *http.Request) {
	var b struct {
		ProjectID int `json:"project_id"`
	}
	if readJSON(r, &b) != nil || b.ProjectID <= 0 {
		writeJSON(w, 400, map[string]string{"error": "invalid body"})
		return
	}
	a.registry.Lock()
	p := a.registry.procs[b.ProjectID]
	a.registry.Unlock()
	if p == nil {
		writeJSON(w, 404, map[string]string{"error": "process not found"})
		return
	}
	a.terminate(p)
	a.logs.kill.Info("process stopped", "project_id", b.ProjectID)
	writeJSON(w, 200, map[string]bool{"success": true})
}
func (a *app) handleStatus(w http.ResponseWriter, r *http.Request) {
	var b struct {
		ProjectID int `json:"project_id"`
	}
	if readJSON(r, &b) != nil || b.ProjectID <= 0 {
		writeJSON(w, 400, map[string]string{"error": "project_id required"})
		return
	}
	a.registry.Lock()
	p := a.registry.procs[b.ProjectID]
	a.registry.Unlock()
	status, pid := "stopped", 0
	if p != nil {
		status = "running"
		pid = p.cmd.Process.Pid
	}
	a.logs.status.Debug("status", "project_id", b.ProjectID, "status", status)
	writeJSON(w, 200, map[string]any{"project_id": b.ProjectID, "status": status, "process_id": pid})
}
func (a *app) handleOpen(w http.ResponseWriter, r *http.Request) {
	var b struct {
		Path     string `json:"path"`
		Language string `json:"language"`
	}
	if readJSON(r, &b) != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid body"})
		return
	}
	root, e := projectPath(b.Path)
	if e != nil {
		writeJSON(w, 400, map[string]string{"error": e.Error()})
		return
	}
	editor := a.config.editor(b.Language)
	exe, e := resolve(editor)
	if e != nil {
		writeJSON(w, 500, map[string]string{"error": e.Error()})
		return
	}
	args := []string{root}
	if filepath.Base(editor) == "zeditor" {
		args = []string{"-n", root}
	}
	cmd := exec.Command(exe, args...)
	if e = cmd.Start(); e != nil {
		writeJSON(w, 500, map[string]string{"error": e.Error()})
		return
	}
	go func() { _ = cmd.Wait() }()
	a.logs.open.Info("editor started")
	writeJSON(w, 200, map[string]bool{"success": true})
}
func (a *app) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/spawn", a.handleSpawn)
	mux.HandleFunc("/kill", a.handleKill)
	mux.HandleFunc("/status", a.handleStatus)
	mux.HandleFunc("/open", a.handleOpen)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Browser-origin requests are not part of the Node-to-Marshal contract.
		if r.Header.Get("Origin") != "" {
			writeJSON(w, 403, map[string]string{"error": "browser-origin requests forbidden"})
			return
		}
		if r.Method != "POST" {
			w.Header().Set("Allow", "POST")
			writeJSON(w, 405, map[string]string{"error": "POST required"})
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 65536)
		mux.ServeHTTP(w, r)
	})
}
func run() error {
	c, e := loadConfig()
	if e != nil {
		return e
	}
	l, e := initLoggers(c.Logging)
	if e != nil {
		return e
	}
	defer l.close()
	a := &app{config: c, logs: l, registry: processRegistry{procs: make(map[int]*managedProcess)}}
	srv := &http.Server{Addr: net.JoinHostPort(c.Server.Host, fmt.Sprint(c.Server.Port)), Handler: a.routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	result := make(chan error, 1)
	go func() { result <- srv.ListenAndServe() }()
	select {
	case e = <-result:
	case <-ctx.Done():
	}
	shutdownCtx := context.Background()
	// Complete handlers before closing process logs or category writers.
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}
	a.registry.Lock()
	ps := make([]*managedProcess, 0, len(a.registry.procs))
	for _, p := range a.registry.procs {
		ps = append(ps, p)
	}
	a.registry.Unlock()
	var wg sync.WaitGroup
	for _, p := range ps {
		wg.Add(1)
		go func() { defer wg.Done(); a.terminate(p) }()
	}
	wg.Wait()
	if errors.Is(e, http.ErrServerClosed) {
		return nil
	}
	return e
}
func main() {
	if e := run(); e != nil {
		fmt.Fprintln(os.Stderr, "marshal:", e)
		os.Exit(1)
	}
}
