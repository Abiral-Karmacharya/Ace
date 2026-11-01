import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArchives } from "../api/projects";
import MatrixRain from "../components/MatrixRain";
import SystemOnline from "../components/SystemOnline";
import EKGLine from "../components/EKGLine";
import CountUp from "../components/CountUp";
import ArchiveCard from "../components/ArchiveCard";

function StatCard({ label, value, color }) {
  return (
    <div className="bg-card border border-cardborder rounded-lg p-4 flex flex-col items-center justify-center min-w-[120px]">
      <span className="text-2xl font-bold" style={{ color }}>
        <CountUp value={value} />
      </span>
      <span className="text-xs text-mutedtext uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

export default function Archive() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchArchive() {
      const result = await getArchives();
      if (result.ok) {
        setProjects(result.project);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    fetchArchive();
  }, []);

  const total = projects.length;
  const linger = projects.filter((p) => p.type === "linger").length;
  const withDomain = projects.filter((p) => p.domain !== null).length;
  return (
    <div className="relative min-h-screen animate-fade-in">
      <MatrixRain />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primarytext tracking-wider">
              ARCHIVE
            </h1>
            <div className="w-48">
              <EKGLine />
            </div>
          </div>
          <SystemOnline />
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-8">
          <StatCard label="total" value={total} color="#38bdf8" />
          <StatCard label="linger" value={linger} color="#a78bfa" />
          <StatCard label="domains" value={withDomain} color="#3fb950" />
        </div>

        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/"
            className="btn-glow inline-block px-4 py-2 text-sm bg-cardborder text-skyblue border border-skyblue rounded hover:bg-electric/40"
          >
            ← back to dashboard
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-mutedtext text-sm animate-pulse">
            loading archive...
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-danger text-sm">! {error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && projects.length === 0 && (
          <div className="text-mutedtext text-sm">no archived projects</div>
        )}

        {/* Project grid */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <ArchiveCard
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
