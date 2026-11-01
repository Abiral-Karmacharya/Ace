import { useNavigate } from "react-router-dom";

const TYPE_COLORS = {
  one_off: "#3b82f6",
  linger: "#3fb950",
  process: "#fbbf24",
};

const LANG_EMOJI = {
  python: "🐍",
  node: "🟢",
  go: "🐹",
  bash: "🐚",
  react: "⚛️",
  lua: "🌙",
};

// Distinct visual colors for the dynamic theme families
const THEME_COLORS = {
  root: "#a855f7", // Purple
  midas: "#eab308", // Gold / Yellow
  court: "#ec4899", // Pink
  eclipse: "#6366f1", // Indigo
  ecplise: "#6366f1", // Catch typo variant from database
  ambassador: "#14b8a6", // Teal
};

function StatusDot({ status }) {
  const running = status === "running";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-3 h-3 rounded-full ${
          running
            ? "bg-success animate-pulse-green"
            : "bg-danger animate-pulse-red"
        }`}
      />
      <span
        className={running ? "text-success text-xs" : "text-danger text-xs"}
      >
        {status}
      </span>
    </div>
  );
}

export default function ProjectCard({ project, index }) {
  const navigate = useNavigate();

  const typeColor = TYPE_COLORS[project.type] || "#3b82f6";
  const themeColor =
    THEME_COLORS[project.theme_name?.toLowerCase()] || "#94a3b8";
  const running = project.status === "running";

  return (
    <div
      role="link"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.click(); }}
      onClick={() => navigate(`/projects/${project.project_id}`)}
      className="project-card card-stagger relative overflow-hidden rounded-lg bg-card border border-cardborder p-5 cursor-pointer transition-all hover:border-skyblue/50 hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] flex flex-col justify-between"
      style={{
        borderTop: `2px solid ${typeColor}`,
        animationDelay: `${index * 80}ms`,
        
      }}
    >
      {/* Scanline for running cards */}
      {running && (
        <div
          className="scanline-overlay animate-scanline"
          style={{ animationDelay: `${index * 0.5}s` }}
        />
      )}

      {/* Main Content Area */}
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-primarytext">{project.name}</h3>
          <StatusDot status={project.status || "stopped"} />
        </div>

        {/* Description */}
        <p className="text-sm text-mutedtext mb-3">{project.description}</p>

        {/* Core Badges (Type & Language) */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: typeColor + "22", color: typeColor }}
          >
            {project.type}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-cardborder text-skyblue border border-skyblue/30">
            {LANG_EMOJI[project.language] || "📄"} {project.language}
          </span>
        </div>

        {/* Port & Domain for linger */}
        {project.type === "linger" && project.port && (
          <p className="text-xs text-gold mb-2">→ localhost:{project.port}</p>
        )}

        {project.type === "linger" && project.domain && (
          <a
            href={`http://${project.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold mb-2 hover:underline inline-block"
          >
            → {project.domain}
          </a>
        )}

        {/* Path & Entry */}
        <div className="text-xs text-mutedtext/70 mb-4 space-y-0.5">
          <p>path: {project.path}</p>
          <p>entry: {project.entry}</p>
        </div>
      </div>

      {/* Bottom Footer Section: Theme, Direction & Criticality */}
      <div className="pt-3 mt-auto border-t border-cardborder/60 flex items-center justify-between text-xs">
        {/* Dynamic Theme Family Pill */}
        {project.theme_name && (
          <span
            className="px-2 py-0.5 rounded font-mono font-semibold tracking-wide border"
            style={{
              backgroundColor: `${themeColor}18`,
              color: themeColor,
              borderColor: `${themeColor}44`,
            }}
          >
            ❖ {project.theme_name}
          </span>
        )}

        {/* Axis Direction & Criticality */}
        <div className="flex items-center gap-2 font-mono text-mutedtext/80">
          {project.direction && (
            <span className="bg-cardborder/40 px-1.5 py-0.5 rounded text-[11px]">
              dir: <span className="text-primarytext">{project.direction}</span>
            </span>
          )}
          {project.criticality && (
            <span className="bg-cardborder/40 px-1.5 py-0.5 rounded text-[11px]">
              crit:{" "}
              <span className="text-primarytext">{project.criticality}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
