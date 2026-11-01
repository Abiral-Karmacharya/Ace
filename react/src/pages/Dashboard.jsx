import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProjects } from "../api/projects";
import MatrixRain from "../components/MatrixRain";
import SystemOnline from "../components/SystemOnline";
import CountUp from "../components/CountUp";
import ProjectCard from "../components/ProjectCard";

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <span className="text-2xl font-bold" style={{ color }}>
        <CountUp value={value} />
      </span>
      <span className="text-xs text-mutedtext uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchProjects() {
      const result = await listProjects();
      if (result.ok) {
        setProjects(result.projects);
        setCount(result.count);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const total = projects.length;
  const stopped = total - count;
  const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filteredProjects = projects.filter((project) => {
    const searchableText = [
      project.name, project.description, project.project_id,
      project.language, project.type, project.status || "stopped",
      project.theme_name, project.path, project.entry, project.domain,
      project.port, project.direction, project.criticality,
    ].map((value) => String(value ?? "").toLowerCase()).join(" ");

    return searchTerms.every((term) => searchableText.includes(term));
  });

  return (
    <div className="relative min-h-screen animate-fade-in">
      <MatrixRain />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-6">
        <div className="dashboard-heading">
          <div><p className="eyebrow">YOUR LOCAL COMMAND CENTER</p><h1>Make room for<br /><span>your next big idea.</span></h1><p className="heading-description">A little order for everything you’re building.</p></div>
          <div className="orbit-art" aria-hidden="true"><div className="orbit-ring" /><div className="orbit-ring inner" /><span className="orbit-core">a↗</span><span className="orbit-dot" /><span className="orbit-label">BUILD. LAUNCH. REPEAT.</span></div>
        </div>
        <div className="overview-label"><span className="eyebrow">WORKSPACE AT A GLANCE</span><SystemOnline /></div>

        {/* Stats row */}
        <div className="stats-grid">
          <StatCard label="Total projects" value={total} color="#edf3ef" />
          <StatCard label="Open projects" value={count} color="#a6edce" />
          <StatCard label="Stopped projects" value={stopped} color="#e6c388" />
        </div>

        <div className="project-section-heading"><div><p className="eyebrow">THE WORKBENCH</p><h2>Your projects<span className="section-dot">.</span></h2></div><Link to="/projects/new" className="primary-action">+ Register project</Link></div>

        {!loading && !error && projects.length > 0 && (
          <div role="search" aria-label="Projects" className="mb-6">
            <label htmlFor="project-search" className="block text-sm text-primarytext mb-2">
              Search projects
            </label>
            <div className="flex items-center gap-3">
              <input
                id="project-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchQuery("");
                }}
                placeholder="Search by name, language, status, or other details…"
                aria-describedby="project-search-count"
                className="min-w-0 flex-1 border border-cardborder text-sm text-primarytext"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="btn-glow px-4 py-3 text-sm text-skyblue border"
                >
                  Clear search
                </button>
              )}
            </div>
            <p id="project-search-count" role="status" className="mt-2 text-xs text-mutedtext">
              Showing {filteredProjects.length} of {total} projects
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-mutedtext text-sm animate-pulse">
            loading projects...
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-danger text-sm">! {error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && projects.length === 0 && (
          <div className="text-mutedtext text-sm">no projects registered</div>
        )}

        {/* Project grid */}
        {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="text-mutedtext text-sm">
            No projects match your search. Try different keywords or clear the search.
          </div>
        )}

        {!loading && !error && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, i) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
