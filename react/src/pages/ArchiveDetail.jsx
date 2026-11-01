import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getArchive, deleteProject, unarchiveProject } from "../api/projects";
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

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wider text-mutedtext mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ArchivedProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [unarchiving, setUnarchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUnarchive, setConfirmUnarchive] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      const result = await getArchive(projectId);
      if (result.ok) {
        setProject(result.archive);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  async function handleUnarchive() {
    if (!confirmUnarchive) {
      setConfirmUnarchive(true);
      return;
    }
    setError(null);
    setUnarchiving(true);
    const result = await unarchiveProject(projectId);
    setUnarchiving(false);
    if (result.ok) {
      navigate("/");
    } else {
      setError(result.error);
      setConfirmUnarchive(false);
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
      navigate("/");
    } else {
      setError(result.error);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen animate-fade-in">
        <MatrixRain />
        <div className="relative z-10 max-w-2xl mx-auto px-8 py-6">
          <p className="text-mutedtext text-sm animate-pulse">
            loading archived project...
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
            ! {error || "archived project not found"}
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primarytext tracking-wider">
              {project.name || "ARCHIVED PROJECT"}
            </h1>
            <span className="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded">
              archived
            </span>
          </div>
          <div
            className="h-0.5 w-64 mt-2"
            style={{ backgroundColor: "#fbbf24" }}
          />
        </div>

        {/* Read-only / Details view */}
        <div className="bg-card border border-cardborder rounded-lg p-6">
          <Field label="name">
            <input
              type="text"
              disabled
              value={project.name || ""}
              className={`${inputClass} opacity-75 cursor-not-allowed`}
            />
          </Field>

          <Field label="description">
            <input
              type="text"
              disabled
              value={project.description || ""}
              className={`${inputClass} opacity-75 cursor-not-allowed`}
            />
          </Field>

          <div className="flex gap-4">
            <div className="flex-1">
              <Field label="type">
                <input
                  type="text"
                  disabled
                  value={project.type || ""}
                  className={`${inputClass} opacity-75 cursor-not-allowed`}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="language">
                <input
                  type="text"
                  disabled
                  value={project.language || ""}
                  className={`${inputClass} opacity-75 cursor-not-allowed`}
                />
              </Field>
            </div>
          </div>

          <Field label="path">
            <input
              type="text"
              disabled
              value={project.path || ""}
              className={`${inputClass} opacity-75 cursor-not-allowed`}
            />
          </Field>

          {error && <p className="text-danger text-sm mb-4">! {error}</p>}

          {/* Action buttons: Unarchive & Delete */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-cardborder">
            <button
              type="button"
              onClick={handleUnarchive}
              disabled={unarchiving}
              className={`flex-1 py-3 rounded text-sm font-medium transition-all border ${
                confirmUnarchive
                  ? "bg-success text-page border-success hover:brightness-125"
                  : "bg-cardborder text-success border-success/50 hover:bg-success/20"
              }`}
            >
              {unarchiving
                ? "unarchiving..."
                : confirmUnarchive
                  ? "confirm unarchive?"
                  : "Unarchive Project"}
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
              {deleting
                ? "deleting..."
                : confirmDelete
                  ? "confirm delete?"
                  : "Delete"}
            </button>
          </div>

          {confirmUnarchive && !unarchiving && (
            <p className="text-success text-xs mt-2 text-center">
              click &quot;confirm unarchive?&quot; to restore this project
            </p>
          )}

          {confirmDelete && !deleting && (
            <p className="text-danger text-xs mt-2 text-center">
              click &quot;confirm delete?&quot; to permanently remove this
              project
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
