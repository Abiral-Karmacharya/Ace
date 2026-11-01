package main

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type rotatingWriter struct {
	mu          sync.Mutex
	f           *os.File
	path        string
	size, limit int64
}

func newWriter(c LoggingConfig, name string) (*rotatingWriter, error) {
	p := filepath.Join(c.Directory, name)
	f, e := os.OpenFile(p, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if e != nil {
		return nil, e
	}
	return &rotatingWriter{f: f, path: p, limit: int64(c.MaxSizeMB) * 1024 * 1024}, nil
}
func (w *rotatingWriter) Write(p []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	total := 0
	for len(p) > 0 {
		if w.size >= w.limit {
			next := fmt.Sprintf("%s.%d", w.path, time.Now().UnixNano())
			f, e := os.OpenFile(next, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
			if e != nil {
				return total, e
			}
			if e = w.f.Close(); e != nil {
				f.Close()
				return total, e
			}
			w.f = f
			w.size = 0
		}
		nmax := int64(len(p))
		if nmax > w.limit-w.size {
			nmax = w.limit - w.size
		}
		n, e := w.f.Write(p[:nmax])
		total += n
		w.size += int64(n)
		p = p[n:]
		if e != nil {
			return total, e
		}
		if n == 0 {
			return total, io.ErrShortWrite
		}
	}
	return total, nil
}
func (w *rotatingWriter) Close() error { w.mu.Lock(); defer w.mu.Unlock(); return w.f.Close() }

type reportWriter struct{ io.Writer }

func (w reportWriter) Write(p []byte) (int, error) {
	n, e := w.Writer.Write(p)
	if e != nil {
		fmt.Fprintln(os.Stderr, "marshal log write failed:", e)
	}
	return n, e
}

type logs struct {
	spawn, kill, status, open *slog.Logger
	files                     []*rotatingWriter
	config                    LoggingConfig
	session                   string
}

func initLoggers(c LoggingConfig) (*logs, error) {
	l := &logs{config: c, session: fmt.Sprintf("%d-%d", os.Getpid(), time.Now().UnixNano())}
	level := map[string]slog.Level{"debug": slog.LevelDebug, "info": slog.LevelInfo, "warn": slog.LevelWarn, "error": slog.LevelError}[c.Level]
	if c.Enabled {
		if e := os.MkdirAll(c.Directory, 0700); e != nil {
			return nil, e
		}
	}
	targets := []**slog.Logger{&l.spawn, &l.kill, &l.status, &l.open}
	for i, name := range []string{"spawn", "kill", "status", "open"} {
		var w io.Writer = io.Discard
		if c.Enabled {
			f, e := newWriter(c, name+"-"+l.session+".log")
			if e != nil {
				l.close()
				return nil, e
			}
			l.files = append(l.files, f)
			w = reportWriter{f}
		}
		*targets[i] = slog.New(slog.NewJSONHandler(w, &slog.HandlerOptions{Level: level}))
	}
	return l, nil
}
func (l *logs) close() {
	for _, f := range l.files {
		if e := f.Close(); e != nil {
			fmt.Fprintln(os.Stderr, e)
		}
	}
}
