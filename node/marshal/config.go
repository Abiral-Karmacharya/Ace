package main

import (
	"fmt"
	"github.com/BurntSushi/toml"
	"net"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Server   ServerConfig   `toml:"server"`
	Logging  LoggingConfig  `toml:"logging"`
	Editors  EditorsConfig  `toml:"editors"`
	Runtimes RuntimesConfig `toml:"runtimes"`
	Process  ProcessConfig  `toml:"process"`
}
type ServerConfig struct {
	Host string `toml:"host"`
	Port int    `toml:"port"`
}
type LoggingConfig struct {
	Enabled   bool   `toml:"enabled"`
	Directory string `toml:"directory"`
	Level     string `toml:"level"`
	MaxSizeMB int    `toml:"max_size_mb"`
}
type EditorsConfig struct {
	Default    string            `toml:"default"`
	ByLanguage map[string]string `toml:"by_language"`
}
type RuntimesConfig struct {
	Python string `toml:"python"`
	Node   string `toml:"node"`
	Go     string `toml:"go"`
	Bash   string `toml:"bash"`
	React  string `toml:"react"`
}
type ProcessConfig struct {
	GracefulShutdownSeconds int `toml:"graceful_shutdown_seconds"`
	MaxRunning              int `toml:"max_running"`
}

func xdg(name, fallback string) string {
	if p := os.Getenv(name); filepath.IsAbs(p) {
		return p
	}
	h, _ := os.UserHomeDir()
	return filepath.Join(h, fallback)
}
func defaults() Config {
	return Config{ServerConfig{"127.0.0.1", 9000}, LoggingConfig{true, filepath.Join(xdg("XDG_STATE_HOME", ".local/state"), "ace/marshal"), "info", 10}, EditorsConfig{"zeditor", map[string]string{"react": "code", "python-gui": "code", "go": "zeditor"}}, RuntimesConfig{"python3", "nodemon", "go", "bash", "node"}, ProcessConfig{5, 10}}
}
func expand(p string) (string, error) {
	if p == "~" || strings.HasPrefix(p, "~/") {
		h, e := os.UserHomeDir()
		if e != nil {
			return "", e
		}
		return filepath.Join(h, strings.TrimPrefix(p, "~/")), nil
	}
	if strings.HasPrefix(p, "~") {
		return "", fmt.Errorf("unsupported home path")
	}
	return p, nil
}
func executableName(p string) error {
	if p == "" || strings.ContainsAny(p, "\x00\r\n\t ") || strings.HasPrefix(p, "-") {
		return fmt.Errorf("executable must be a name or absolute path without arguments")
	}
	if strings.Contains(p, "/") && !filepath.IsAbs(p) {
		return fmt.Errorf("executable path must be absolute")
	}
	return nil
}
func loadConfig() (Config, error) {
	c := defaults()
	p := os.Getenv("ACE_MARSHAL_CONFIG")
	explicit := p != ""
	if !explicit {
		p = filepath.Join(xdg("XDG_CONFIG_HOME", ".config"), "ace/marshal.toml")
	}
	p, e := expand(p)
	if e != nil {
		return c, e
	}
	md, e := toml.DecodeFile(p, &c)
	if e != nil {
		if !os.IsNotExist(e) || explicit {
			return c, fmt.Errorf("config %s: %w", p, e)
		}
	} else if len(md.Undecoded()) > 0 {
		return c, fmt.Errorf("unknown configuration settings: %v", md.Undecoded())
	}
	c.Logging.Directory, e = expand(c.Logging.Directory)
	if e != nil {
		return c, e
	}
	return c, c.validate()
}
func (c Config) validate() error {
	if net.ParseIP(c.Server.Host) == nil || c.Server.Port < 1 || c.Server.Port > 65535 {
		return fmt.Errorf("server requires an IP host and port 1..65535")
	}
	switch c.Logging.Level {
	case "debug", "info", "warn", "error":
	default:
		return fmt.Errorf("invalid logging.level")
	}
	if c.Logging.Directory == "" || !filepath.IsAbs(c.Logging.Directory) || c.Logging.MaxSizeMB < 1 || c.Logging.MaxSizeMB > 1024 {
		return fmt.Errorf("logging requires absolute directory and max_size_mb 1..1024")
	}
	if c.Process.MaxRunning < 1 || c.Process.GracefulShutdownSeconds < 0 || c.Process.GracefulShutdownSeconds > 3600 {
		return fmt.Errorf("invalid process limits")
	}
	for _, p := range []string{c.Editors.Default, c.Runtimes.Python, c.Runtimes.Node, c.Runtimes.Go, c.Runtimes.Bash, c.Runtimes.React} {
		if e := executableName(p); e != nil {
			return e
		}
	}
	for _, p := range c.Editors.ByLanguage {
		if e := executableName(p); e != nil {
			return e
		}
	}
	return nil
}
