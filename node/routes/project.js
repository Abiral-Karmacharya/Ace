const path = require("path"),
  {
    getProjects,
    getProject,
    postProjects,
    updateProject,
    deleteProject,
    openProject,
    launchProject,
    stopProject,
    statusProject,
    streamLogs,
    searchPorts,
    stopDanglingProject,
    archiveProject,
    checkTheme,
    getArchives,
    getArchive,
    unarchive
  } = require(path.join(__dirname, "../controllers/project.js")),
  { validateBody, validateParams } = require(
    path.join(__dirname, "../middleware/validation.js"),
  ),
  app = require("express").Router();
const allowedTypes = /^(linger|one_off|process)$/,
  allowedLangs = /^(node|python|react|go|bash|ruby|php|lua)$/,
  portPattern = /^\d{1,5}$/;

const ProjectRule = {
  name: {
    required: true,
    type: "string",
    min: 2,
    max: 100,
  },
  description: {
    required: true,
    type: "string",
    min: 5,
    max: 500,
  },
  type: {
    required: true,
    type: "string",
    pattern: allowedTypes,
  },
  language: {
    required: true,
    type: "string",
    pattern: allowedLangs,
  },
  path: {
    required: true,
    type: "string",
    min: 1,
    max: 500,
    pattern: /^(?!.*(\.\.|\/\/|\\)).+$/,
  },
  entry: {
    required: false,
    type: "string",
  },
  domain: {
    required: false,
    type: "string",
  },
  port: {
    required: false,
    type: "string",
    pattern: portPattern,
  },
  theme: {
    required: true,
    type: "string",
  },
  direction: {
    required: true,
    type: "string",
  },
  criticality: {
    required: true,
    type: "string`",
  },
};

const ParamsRules = {
  projectId: {
    required: true,
    type: "int",
  },
};

// PATCH accepts any non-empty subset of the create fields.  The controller
// builds its SET clause only from the fields that passed this allow-list.
const UpdateProjectRule = Object.fromEntries(
  Object.entries(ProjectRule).map(([field, rule]) => [
    field,
    { ...rule, required: false },
  ]),
);

app.get("/projects", getProjects);
app.post("/projects", validateBody(ProjectRule), postProjects);
app.get("/lua", searchPorts);
app.post("/lua", stopDanglingProject);
app.get("/archives", getArchives);
app.get("/check/:id", checkTheme);
app.put("/archive/:projectId", validateParams(ParamsRules), archiveProject);
app.get("/archives/:projectId", validateParams(ParamsRules), getArchive);
app.put("/unarchive/:projectId", validateParams(ParamsRules), unarchive)
app.get("/project/:projectId", validateParams(ParamsRules), getProject);
app.patch(
  "/project/:projectId",
  validateParams(ParamsRules),
  validateBody(UpdateProjectRule, { partial: true }),
  updateProject,
);
app.delete("/project/:projectId", validateParams(ParamsRules), deleteProject);
app.get("/open/:projectId", validateParams(ParamsRules), openProject);
app.get("/launch/:projectId", validateParams(ParamsRules), launchProject);
app.get("/stop/:projectId", validateParams(ParamsRules), stopProject);
app.get("/status/:projectId", validateParams(ParamsRules), statusProject);
app.get("/logs/:projectId", streamLogs);
module.exports = app;
