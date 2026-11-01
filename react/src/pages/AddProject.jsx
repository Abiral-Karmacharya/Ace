import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createProject } from "../api/projects";
import MatrixRain from "../components/MatrixRain";

const LANGUAGES = [
  {
    value: "python",
    label: "python",
  },
  { value: "node", label: "node" },
  { value: "go", label: "go" },
  { value: "bash", label: "bash" },
  { value: "react", label: "react" },
  { value: "lua", label: "lua" },
];

const TYPES = ["one_off", "linger", "process"];

const THEME = ["root", "midas", "court", "ecplise", "ambassador"],
  DIRECTION = ["isolate", "uplink", "beacon", "relay"],
  CRITICALITY = ["day", "week", "fortnight", "month"];

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

const inputClass =
  "w-full bg-inputbg border border-cardborder text-primarytext text-sm rounded px-3 py-2 outline-none transition-all placeholder:text-mutedtext/50 focus:border-skyblue focus:shadow-[0_0_8px_rgba(56,189,248,0.4)]";

export default function AddProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "one_off",
    language: "python",
    path: "",
    entry: "",
    port: "",
    domain: "",
    theme: "root",
    direction: "isolate",
    criticality: "day",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const showNetworkFields = form.type === "linger" || form.type === "process";

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  console.log(form.theme);

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

    const result = await createProject(payload);
    setSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => navigate("/"), 600);
    } else {
      setError(result.error);
    }
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
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-primarytext tracking-wider">
            REGISTER PROJECT
          </h1>
          <div
            className="h-0.5 w-64 mt-2"
            style={{ backgroundColor: "#fbbf24" }}
          />
        </div>

        {/* Form card */}
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
              maxHeight: showNetworkFields ? "200px" : "0",
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

          {/* Error */}
          {error && <p className="text-danger text-sm mb-4">! {error}</p>}

          {/* Success flash */}
          {success && (
            <p className="text-success text-sm mb-4">✓ project registered</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || success}
            className={`w-full py-3 rounded text-sm font-medium transition-all ${
              success
                ? "bg-success text-page"
                : "bg-electric text-primarytext hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] hover:brightness-125"
            }`}
          >
            {submitting
              ? "registering..."
              : success
                ? "registered"
                : "Register Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
