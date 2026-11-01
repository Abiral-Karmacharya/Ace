import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getProject,
  updateProject,
  deleteProject,
  streamLogs,
  openProject,
  launchProject,
  stopProject,
  getStatus,
  archiveProject,
} from "../api/projects";
import MatrixRain from "../components/MatrixRain";

const LANGUAGES = [
  { value: "python", label: "🐍 python" },
  { value: "node", label: "🟢 node" },
  { value: "go", label: "🐹 go" },
  { value: "bash", label: "🐚 bash" },
  { value: "react", label: "⚛️ react" },
  { value: "lua", label: "🌙 lua" },
  { value: "rust", label: "rust" },
];

const TYPES = ["one_off", "linger", "process"];

const THEME = ["root", "midas", "court", "ecplise", "ambassador"],
  DIRECTION = ["isolate", "uplink", "beacon", "relay"],
  CRITICALITY = ["day", "week", "fortnight", "month"];

const inputClass =
  "w-full bg-inputbg border border-cardborder text-primarytext text-sm rounded px-3 py-2 outline-none transition-all placeholder:text-mutedtext/50 focus:border-skyblue focus:shadow-[0_0_8px_rgba(56,189,248,0.4)]";

function Field({ label, children, required }) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wider text-mutedtext mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

function EditDeleteTab({ projectId, initialProject, onDeleted }) {
  const [form, setForm] = useState({
    name: initialProject.name || "",
    description: initialProject.description || "",
    type: initialProject.type || "one_off",
    language: initialProject.language || "python",
    path: initialProject.path || "",
    entry: initialProject.entry || "",
    port: initialProject.port || "",
    domain: initialProject.domain || "",
    theme: initialProject.theme_name || "",
    direction: initialProject.direction || "",
    criticality: initialProject.criticality || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archive, setArchive] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showNetworkFields = form.type === "linger" || form.type === "process";

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      type: form.type,
      language: form.language,
      path: form.path,
      entry: form.entry,
      theme: form.theme,
      direction: form.direction,
      criticality: form.criticality,
    };
    if (showNetworkFields) {
      if (form.port) payload.port = form.port;
      if (form.domain) payload.domain = form.domain;
    }

    const result = await updateProject(projectId, payload);
    setSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError(result.error);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError(null);
    setDeleting(true);
    const result = await deleteProject(projectId);
    setDeleting(false);
    if (result.ok) {
      onDeleted();
    } else {
      setError(result.error);
      setConfirmDelete(false);
    }
  }

  async function handleArchive() {
    if (!confirmArchive) {
      setConfirmArchive(true);
      return;
    }
    setError(null);
    setArchive(true);
    const result = await archiveProject(projectId);
    setArchive(false);
    if (result.ok) {
      onDeleted();
    } else {
      setError(result.error);
      setConfirmArchive(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-cardborder rounded-lg p-6"
    >
      <Field label="name" required>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="my-cool-tool"
          className={inputClass}
        />
      </Field>

      <Field label="description" required>
        <input
          type="text"
          required
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="does something cool"
          className={inputClass}
        />
      </Field>

      <div className="flex gap-4">
        <div className="flex-1">
          <Field label="type">
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className={inputClass}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex-1">
          <Field label="language">
            <select
              value={form.language}
              onChange={(e) => update("language", e.target.value)}
              className={inputClass}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <Field label="path" required>
        <input
          type="text"
          required
          value={form.path}
          onChange={(e) => update("path", e.target.value)}
          placeholder="/home/user/projects/my-tool"
          className={inputClass}
        />
      </Field>

      <Field label="entry">
        <input
          type="text"
          value={form.entry}
          onChange={(e) => update("entry", e.target.value)}
          placeholder="main.py"
          className={inputClass}
        />
      </Field>

      <div className="flex gap-4">
        <div className="flex-1">
          <Field label="theme">
            <select
              value={form.theme}
              onChange={(e) => update("theme", e.target.value)}
              className={inputClass}
            >
              {THEME.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="direction">
            <select
              value={form.direction}
              onChange={(e) => update("direction", e.target.value)}
              className={inputClass}
            >
              {DIRECTION.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="criticality">
            <select
              value={form.criticality}
              onChange={(e) => update("criticality", e.target.value)}
              className={inputClass}
            >
              {CRITICALITY.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Port + Domain fields — for linger and process, animated slide */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: showNetworkFields ? "300px" : "0",
          opacity: showNetworkFields ? "1" : "0",
          transform:
            showNetworkFields ? "translateY(0)" : "translateY(-10px)",
        }}
      >
        <Field label="port">
          <input
            type="text"
            value={form.port}
            onChange={(e) => update("port", e.target.value)}
            placeholder="3000"
            className={inputClass}
          />
        </Field>
        <Field label="domain">
          <input
            type="text"
            value={form.domain}
            onChange={(e) => update("domain", e.target.value)}
            placeholder="ace.com"
            className={inputClass}
          />
        </Field>
      </div>

      {error && <p className="text-danger text-sm mb-4">! {error}</p>}
      {success && (
        <p className="text-success text-sm mb-4">✓ project updated</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || success}
          className={`flex-1 py-3 rounded text-sm font-medium transition-all ${
            success
              ? "bg-success text-page"
              : "bg-electric text-primarytext hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] hover:brightness-125"
          }`}
        >
          {submitting ? "updating..." : success ? "updated" : "Update Project"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={`px-6 py-3 rounded text-sm font-medium transition-all border ${
            confirmDelete
              ? "bg-danger text-page border-danger hover:brightness-125"
              : "bg-cardborder text-danger border-danger/50 hover:bg-danger/20"
          }`}
        >
          {deleting ? "deleting..." : confirmDelete ? "confirm?" : "Delete"}
        </button>
        <button
          type="button"
          onClick={handleArchive}
          disabled={archive}
          className={`px-6 py-3 rounded text-sm font-medium transition-all border ${
            confirmArchive
              ? "bg-yellow-500 text-neutral-900 border-yellow-500 hover:bg-yellow-400"
              : "bg-cardborder text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10"
          }`}
        >
          {archive ? "archiving..." : confirmArchive ? "confirm?" : "Archive"}
        </button>
      </div>

      {confirmDelete && !deleting && (
        <p className="text-danger text-xs mt-2">
          click &quot;confirm?&quot; to permanently delete this project
        </p>
      )}

      {confirmArchive && !archive && (
        <p className="text-danger text-xs mt-2">
          click &quot;confirm?&quot; to archive this project
        </p>
      )}
    </form>
  );
}

function LogsTab({ projectId }) {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    setLogs([]);
    setConnected(false);
    setError(null);

    const cleanup = streamLogs(
      projectId,
      (line) => {
        setConnected(true);
        setLogs((prev) => [...prev, line]);
      },
      (err) => {
        setError(err);
        setConnected(false);
      },
    );

    return cleanup;
  }, [projectId]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-card border border-cardborder rounded-lg overflow-hidden">
      {/* Connection status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cardborder bg-cardborder/30">
        <span className="text-xs text-mutedtext uppercase tracking-wider">
          live logs
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              connected
                ? "bg-success animate-pulse-green"
                : "bg-danger animate-pulse-red"
            }`}
          />
          <span
            className={`text-xs ${connected ? "text-success" : "text-danger"}`}
          >
            {connected ? "streaming" : error ? "disconnected" : "connecting..."}
          </span>
        </div>
      </div>

      {/* Log output */}
      <div
        ref={logEndRef}
        className="h-[500px] overflow-y-auto p-4 font-mono text-xs space-y-0.5"
        style={{ scrollBehavior: "smooth" }}
      >
        {logs.length === 0 && !error && (
          <p className="text-mutedtext animate-pulse">waiting for logs...</p>
        )}
        {error && logs.length === 0 && <p className="text-danger">! {error}</p>}
        {logs.map((line, i) => (
          <p
            key={i}
            className="text-primarytext/90 break-all"
            style={{
              color:
                line.startsWith("ERROR") || line.startsWith("!")
                  ? "#f85149"
                  : undefined,
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function SystemTab({ projectId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus || "stopped");
  const [error, setError] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [fetched, setFetched] = useState(false);

  const running = status === "running";

  useEffect(() => {
    if (fetched) return;
    async function fetchStatus() {
      const res = await getStatus(projectId);
      if (res.ok && res.status) {
        setStatus(res.status);
      }
      setFetched(true);
    }
    fetchStatus();
  }, [projectId, fetched]);

  async function handleAction(action, fn) {
    setError(null);
    setLoadingAction(action);
    const result = await fn(projectId);
    if (!result.ok) {
      setError(result.error);
      setLoadingAction(null);
      return;
    }
    const statusRes = await getStatus(projectId);
    if (statusRes.ok && statusRes.status) {
      setStatus(statusRes.status);
    } else if (statusRes.error) {
      setError(statusRes.error);
    }
    setLoadingAction(null);
  }

  return (
    <div className="bg-card border border-cardborder rounded-lg p-6">
      {/* Status display */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-cardborder">
        <span className="text-xs uppercase tracking-wider text-mutedtext">
          process status
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              running
                ? "bg-success animate-pulse-green"
                : "bg-danger animate-pulse-red"
            }`}
          />
          <span
            className={`text-sm font-medium ${running ? "text-success" : "text-danger"}`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-danger text-sm mb-4">! {error}</p>}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleAction("open", openProject)}
          disabled={loadingAction !== null}
          className={`btn-glow flex-1 px-2 py-2.5 text-sm rounded border transition-all ${
            loadingAction === "open"
              ? "opacity-60 cursor-wait bg-electric/40 text-skyblue border-skyblue"
              : "bg-cardborder text-skyblue border-skyblue hover:bg-electric/40"
          }`}
        >
          {loadingAction === "open" ? "..." : "open"}
        </button>
        <button
          onClick={() => handleAction("launch", launchProject)}
          disabled={running || loadingAction !== null}
          className={`btn-glow flex-1 px-2 py-2.5 text-sm rounded border transition-all ${
            running || (loadingAction !== null && loadingAction !== "launch")
              ? "opacity-40 cursor-not-allowed bg-cardborder text-skyblue border-skyblue"
              : loadingAction === "launch"
                ? "opacity-60 cursor-wait bg-electric/40 text-skyblue border-skyblue"
                : "bg-cardborder text-skyblue border-skyblue hover:bg-electric/40"
          }`}
        >
          {loadingAction === "launch" ? "..." : "launch"}
        </button>
        <button
          onClick={() => handleAction("stop", stopProject)}
          disabled={!running || loadingAction !== null}
          className={`btn-glow flex-1 px-2 py-2.5 text-sm rounded border transition-all ${
            !running || (loadingAction !== null && loadingAction !== "stop")
              ? "opacity-40 cursor-not-allowed bg-cardborder text-skyblue border-skyblue"
              : loadingAction === "stop"
                ? "opacity-60 cursor-wait bg-electric/40 text-skyblue border-skyblue"
                : "bg-cardborder text-skyblue border-skyblue hover:bg-electric/40"
          }`}
        >
          {loadingAction === "stop" ? "..." : "stop"}
        </button>
        <button
          onClick={() => handleAction("status", async () => ({ ok: true }))}
          disabled={loadingAction !== null}
          className={`btn-glow flex-1 px-2 py-2.5 text-sm rounded border transition-all ${
            loadingAction === "status"
              ? "opacity-60 cursor-wait bg-electric/40 text-skyblue border-skyblue"
              : "bg-cardborder text-skyblue border-skyblue hover:bg-electric/40"
          }`}
        >
          {loadingAction === "status" ? "..." : "status"}
        </button>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    async function fetchProject() {
      const result = await getProject(projectId);
      if (result.ok) {
        setProject(result.project);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="relative min-h-screen animate-fade-in">
        <MatrixRain />
        <div className="relative z-10 max-w-2xl mx-auto px-8 py-6">
          <p className="text-mutedtext text-sm animate-pulse">
            loading project...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="relative min-h-screen animate-fade-in">
        <MatrixRain />
        <div className="relative z-10 max-w-2xl mx-auto px-8 py-6">
          <Link
            to="/"
            className="text-mutedtext text-sm hover:text-skyblue transition-colors"
          >
            ← back
          </Link>
          <p className="text-danger text-sm mt-6">
            ! {error || "project not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen animate-fade-in">
      <MatrixRain />

      <div className="relative z-10 max-w-2xl mx-auto px-8 py-6">
        {/* Back link */}
        <Link
          to="/"
          className="text-mutedtext text-sm hover:text-skyblue transition-colors"
        >
          ← back
        </Link>

        {/* Header */}
        <div className="mt-6 mb-6">
          <h1 className="text-3xl font-bold text-primarytext tracking-wider">
            {project.name || "PROJECT"}
          </h1>
          <div
            className="h-0.5 w-64 mt-2"
            style={{ backgroundColor: "#fbbf24" }}
          />
        </div>

        {/* Tab navbar */}
        <div className="flex gap-1 mb-6 border-b border-cardborder">
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === "edit"
                ? "text-skyblue border-skyblue"
                : "text-mutedtext border-transparent hover:text-primarytext"
            }`}
          >
            edit / delete
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === "logs"
                ? "text-skyblue border-skyblue"
                : "text-mutedtext border-transparent hover:text-primarytext"
            }`}
          >
            logs
          </button>
          <button
            onClick={() => setActiveTab("system")}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === "system"
                ? "text-skyblue border-skyblue"
                : "text-mutedtext border-transparent hover:text-primarytext"
            }`}
          >
            system
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "edit" && (
          <EditDeleteTab
            projectId={projectId}
            initialProject={project}
            onDeleted={() => navigate("/")}
          />
        )}
        {activeTab === "logs" && <LogsTab projectId={projectId} />}
        {activeTab === "system" && (
          <SystemTab projectId={projectId} initialStatus={project.status} />
        )}
      </div>
    </div>
  );
}
