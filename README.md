# ACE — Project Management & Orchestration

ACE is a self-hosted project management and orchestration application designed to help developers organize, monitor, and manage their local software projects.

It combines a React dashboard, a Node.js backend, and a Go-based process manager called **Marshal**.

ACE began as a personal solution for managing multiple software projects and their associated tools, processes, and configurations.

## Overview

ACE provides a centralized interface for working with projects across different languages and runtimes.

Its architecture consists of three primary components:

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Dashboard and user interaction |
| Backend | Node.js | Application API and project management |
| Marshal | Go | Local process execution and lifecycle management |

### Project organization

ACE uses the AXIS classification system to organize projects through three dimensions:

- **Theme:** A naming convention or identity used to group projects.
- **Reliability:** Relationships between dependent projects, using `rely`, `relied`, `both`, and `standalone`.
- **Criticality:** The expected impact of a project's failure, categorized as `day`, `week`, `fortnight`, or `month`.

These classifications originated from ACE's personal development environment. Their customization and generalization for other users may require additional development.

## Project structure

```text
ace/
├── react/                  # React frontend
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── node/                   # Node.js services
│   └── marshal/            # Go process manager
│       ├── main.go
│       ├── config.go
│       ├── logging.go
│       ├── go.mod
│       └── marshal.example.toml
│
├── .gitignore
└── README.md
```

This is a simplified representation. Other application files and directories may be present.

---

# 1. React Frontend

The frontend provides ACE's graphical interface for project management and process monitoring.

**Technology:** React, JavaScript, Vite.

## Requirements

- Node.js and npm
- A running ACE backend
- Access to the configured API endpoint

## Installation

Navigate to the frontend directory:

```bash
cd react
npm install
```

Create a local environment configuration from the example, if provided:

```bash
cp .env.example .env
```

An example development configuration is:

```env
PORT=5175
API_LINK=http://localhost:3178
ALLOWED_HOST=localhost,ace.local
```

| Variable | Description |
|---|---|
| `PORT` | Port used by the Vite development server |
| `API_LINK` | Backend target for the Vite development proxy |
| `ALLOWED_HOST` | Comma-separated hostnames permitted by the development server |

The Vite configuration must load these values using `loadEnv()`.

## Start the frontend

```bash
npm run dev
```

Open the address displayed by Vite in your browser.

## Production build

```bash
npm run build
```

The production build is generated in the `dist/` directory unless the Vite output directory has been customized.

A production deployment should serve the generated static files through a web server such as Caddy.

### API routing

For same-origin deployment, frontend API requests can use relative paths:

```js
import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export default client;
```

During development, Vite can proxy `/api` requests to the configured backend.

In production, configure the reverse proxy to forward API requests directly to Node.js. Vite's development proxy does not operate in production builds.

Do not expose authentication secrets or private backend credentials through `VITE_` environment variables.

---

# 2. Node.js Backend

The Node.js backend is responsible for ACE's application logic, project data, and communication with supporting services.

Marshal is a separate local process-management component and should not be treated as an ordinary public API.

## Requirements

- Node.js and npm
- The database required by the ACE backend
- Appropriate local configuration
- Marshal, when process-management functionality is required

## Setup

Locate the Node.js backend's `package.json` and install its dependencies from that directory:

```bash
npm install
```

Create the backend's local environment configuration using its documented example file.

Configure the database connection, server address, and any other settings required by the backend.

Start the backend using the script defined in its `package.json`.

The exact startup command, environment variable names, database initialization steps, and API routes should be documented according to the actual backend implementation.

## Security considerations

The backend should:

- Validate and sanitize incoming data.
- Authenticate users where required.
- Enforce authorization for protected operations.
- Avoid exposing database credentials or internal configuration.
- Restrict access to privileged local services.
- Handle errors without leaking sensitive internal details.
- Apply appropriate restrictions to process-management requests.

**Important:** Marshal must not be exposed to untrusted clients simply because the backend can communicate with it.

---

# 3. Configuration and Deployment

ACE separates application configuration from source code wherever practical.

## Environment files

Environment files are intended for machine-specific configuration.

Use `.env.example` files to document required settings without committing private values.

Example `.gitignore` rules:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
*.log
```

Review other generated files and local databases before publishing the repository.

An ignored file may still exist in older Git commits. Removing it from the current working tree does not remove it from repository history.

## Deployment considerations

For deployment:

1. Build the React frontend.
2. Configure and start the Node.js backend.
3. Configure the backend's database and required services.
4. Install and configure Marshal locally if process management is needed.
5. Set up a reverse proxy for the frontend and API.
6. Verify authorization, network exposure, data persistence, and service permissions.

A typical architecture is:

```text
Browser
   |
   v
Caddy
   |
   +---- Frontend static files (React)
   |
   +---- /api/* ----> Node.js backend
                           |
                           v
                    Local ACE services
                           |
                           v
                        Marshal
```

Marshal should remain bound to a loopback address unless a specifically secured alternative has been designed.

Before allowing other users to access ACE, review the backend's authorization model and its integration with Marshal.

---

# 4. Marshal — Local Process Manager

Marshal is a Unix process manager for ACE, written in Go.

It provides local HTTP endpoints for starting, stopping, checking, and opening project processes.

Marshal is designed to run under a normal user account, not with elevated privileges.

## 4.1 Building and running

Navigate to the Marshal directory:

```bash
cd node/marshal
```

Build using the Go version specified in `go.mod`:

```bash
go build -o marshal .
```

Run:

```bash
./marshal
```

Alternatively:

```bash
go run .
```

**Use `go run .`, not `go run main.go`.**

Marshal uses multiple Go source files for configuration, process management, and logging.

Install the runtimes and editors your projects require. Missing executables produce request errors rather than preventing Marshal from starting.

## 4.2 TOML configuration

Marshal uses TOML for runtime settings, logging, editor preferences, and process-management options.

Create a configuration directory:

```bash
mkdir -p ~/.config/ace
```

Copy the example configuration if a user configuration does not already exist:

```bash
cp -n marshal.example.toml ~/.config/ace/marshal.toml
```

Marshal does not automatically write configuration files.

An explicitly selected configuration path can be provided through:

```bash
ACE_MARSHAL_CONFIG=/path/to/marshal.toml ./marshal
```

An explicitly selected missing configuration file is an error.

Otherwise, Marshal searches for its configuration under:

```text
$XDG_CONFIG_HOME/ace/marshal.toml
```

or, when no applicable XDG directory is configured:

```text
~/.config/ace/marshal.toml
```

If the default configuration file is missing, Marshal uses built-in defaults.

Partial configuration files inherit default values. Invalid TOML, unknown keys, and invalid values cause startup to fail.

Paths support `~` and `~/`, but not `~otheruser`.

Only absolute XDG paths are used.

`XDG_STATE_HOME` controls the default logging base directory, falling back to `~/.local/state`.

An explicit TOML `logging.directory` takes precedence.

These XDG settings and `ACE_MARSHAL_CONFIG` are the supported configuration environment overrides. `PATH` is used to locate executable names, and subprocesses inherit the environment.

### Example configuration

```toml
[server]
host = "127.0.0.1"
port = 9000

[logging]
enabled = true
directory = "~/.local/state/ace/marshal"
level = "info"
max_size_mb = 10

[editors]
default = "zeditor"

[editors.by_language]
react = "code"
python-gui = "code"
go = "zeditor"

[runtimes]
python = "python3"
node = "nodemon"
go = "go"
bash = "bash"
react = "node"

[process]
graceful_shutdown_seconds = 5
max_running = 10
```

### Configuration structures

The Go implementation uses the following configuration structures:

| Structure | Fields |
|---|---|
| `Config` | Server, Logging, Editors, Runtimes, Process |
| `ServerConfig` | Host string, Port int |
| `LoggingConfig` | Enabled bool, Directory string, Level string, MaxSizeMB int |
| `EditorsConfig` | Default string, ByLanguage map[string]string |
| `RuntimesConfig` | Python, Node, Go, Bash, React string |
| `ProcessConfig` | GracefulShutdownSeconds int, MaxRunning int |

The TOML tags in `config.go` map these fields to their configuration keys.

## 4.3 Logging

Marshal supports configurable persistent logging.

To disable persistent logging:

```toml
[logging]
enabled = false
```

When disabled:

- No persistent category or project output logs are created.
- No log directories or files are created or opened for logging.
- Category loggers remain valid discard loggers.
- Startup and I/O failures may still appear on stderr.
- Marshal continues to operate without file logging.

### Enabled logging

When enabled, Marshal maintains four logging categories:

| Category | Purpose |
|---|---|
| Spawn | Process launch operations |
| Kill | Process termination operations |
| Status | Process status operations |
| Open | Editor launch operations |

Marshal also records per-project stdout and stderr.

Supported category log levels are:

```text
debug
info
warn
error
```

Project output is recorded as raw combined stdout/stderr independently of the category log level.

### Log storage and rotation

- New directories are created with `0700` permissions.
- New files are created with `0600` permissions.
- Existing directory permissions are not modified.
- Each run or launch creates fresh log names.
- Writes are serialized.
- `max_size_mb` accepts values from 1 to 1024.
- Once a log segment reaches the configured limit, a new uniquely named segment is created.
- Existing segments are retained rather than overwritten.

**Log rotation does not impose a total disk-usage limit.**

Inactive logs must be archived or deleted manually.

Project processes may print sensitive information. Disable persistent logging when necessary.

Marshal does not log request bodies.

## 4.4 Runtime and editor configuration

Marshal uses its TOML configuration to select executables for supported runtimes.

Configured runtime values must be executable names or absolute paths, without whitespace or additional command arguments.

Values are validated and resolved when needed.

Marshal does not construct shell command strings for execution.

### Supported runtime behavior

| Runtime | Execution |
|---|---|
| Python | Python interpreter with absolute entry file |
| Node.js | Configured Node development runtime with absolute entry file |
| Bash | Bash interpreter with absolute entry file |
| Go | `go run` with project entry file |
| React | Project-local Vite executable and configuration |

React uses:

```text
<project>/node_modules/.bin/vite
```

with:

```text
--config <project>/vite.config.js
```

The Vite executable and configuration must satisfy Marshal's project-path confinement requirements.

### Editors

Editor selection follows:

1. Matching `editors.by_language` entry.
2. Default editor configured under `editors.default`.

For compatibility, `zeditor` retains its historical `-n` argument.

Other configured editors receive the project directory.

## 4.5 HTTP endpoints

Marshal exposes the following local HTTP endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/spawn` | Start a project |
| POST | `/kill` | Terminate a project |
| POST | `/status` | Check a project's process status |
| POST | `/open` | Open a project in an editor |

Existing JSON field names and success response shapes are preserved.

### Spawn request

```json
{
  "project_id": 1,
  "path": "/absolute/path/to/project",
  "entry": "main.py",
  "language": "python"
}
```

### Kill and status requests

```json
{
  "project_id": 1
}
```

### Open request

```json
{
  "path": "/absolute/path/to/project",
  "language": "python"
}
```

Spawn, kill, and status require a positive `project_id`.

Spawn accepts `path`, `entry`, and `language`. Open accepts `path` and `language`.

### Request restrictions

- Only POST requests are supported.
- Request bodies are limited to 64 KiB.
- Only a single JSON value is accepted.
- Project paths must be existing absolute directories.
- Entry points must resolve to regular files inside the project.
- Symlink resolution is considered when checking file containment.
- React's Vite executable and configuration paths follow the same confinement requirements.
- Browser requests containing an `Origin` header are rejected.
- Existing Node-to-Marshal requests without `Origin` remain supported.

These stricter validations may reject requests accepted by older Marshal versions.

Origin rejection is only an additional browser safeguard, not authentication.

## 4.6 Process lifecycle

Marshal maintains an internal registry of managed project processes.

Its process-management behavior includes:

- Rejecting duplicate running project IDs.
- Enforcing the configured maximum number of running projects.
- Synchronizing registry operations.
- Reaping normally exited child processes.
- Removing completed processes from the registry.
- Graceful termination using SIGTERM.
- Forceful termination using SIGKILL after the configured timeout.
- Closing logging resources after process output copying finishes.

The grace period is configured through:

```toml
[process]
graceful_shutdown_seconds = 5
max_running = 10
```

Processes that detach themselves and escape their process group cannot necessarily be managed by Marshal.

Editor processes are reaped but are not included in the project registry or running-project limit.

## 4.7 Security boundary and limitations

**Marshal is a local command-execution service. Treat it as a privileged component of ACE.**

The default configuration binds Marshal to:

```toml
[server]
host = "127.0.0.1"
port = 9000
```

Keep the host bound to `127.0.0.1` or `::1` unless a secure alternative has been explicitly designed.

Other literal IP addresses may be accepted as an operator decision, but they can expose an unauthenticated command-execution API.

### Security limitations

Marshal currently has several important trust assumptions:

- Any client able to access its local API may request execution of project code.
- Project-path confinement does not establish whether a project is trusted.
- Filesystem checks do not eliminate all symlink race conditions.
- Marshal does not sandbox launched programs.
- Launched programs may access other files permitted to their operating-system user.
- Runtime executables, `PATH`, and project dependencies must be trusted.
- Origin rejection does not replace authentication or authorization.

**Never expose Marshal directly to untrusted networks or run it with elevated privileges.**

An authoritative project-ID/path allowlist or authenticated backend protocol requires coordinated ACE integration work.

These protections are not silently introduced by Marshal's configuration refactor.

API authorization and trusted-project enrollment remain unfinished security work.

## 4.8 Development checks

Format Go files:

```bash
gofmt -w *.go
```

Run the test suite with the race detector:

```bash
go test -race ./...
```

Run static analysis:

```bash
go vet ./...
```

Build Marshal:

```bash
go build -o /tmp/ace-marshal .
```

Tests use the test executable as a controlled subprocess rather than executing configured project programs.

Successful tests do not replace a security review of Marshal's execution and authorization boundaries.

---

# License

A license has not been specified in this README. Consult the repository's `LICENSE` file if one is provided.

# Project Status

ACE is under active development and is evolving from a personal development tool into a more configurable and distributable application.

Some components retain assumptions from the original local environment. Review the configuration, deployment, and security limitations before using ACE in a shared or publicly accessible environment.
