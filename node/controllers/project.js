const path = require("path"),
  db = require(path.join(__dirname, "../db/db.js")),
  fs = require("fs"),
  { execFile } = require("child_process");

const system = async (req, res, link, headers) => {
  const { projectId } = req.vparams;
  try {
    const data = db
        .prepare(
          "SELECT project_id, path, entry, language from projects where project_id = ?",
        )
        .get(projectId),
      response = await fetch(link, {
        ...headers,
        body: JSON.stringify({
          project_id: data.project_id,
          path: data.path,
          entry: data.entry,
          language: data.language,
        }),
      });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Upstream error: ${errorText}`,
      });
    }
    return res.json(await response.json());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const checkTheme = (theme) => {
  try {
    const themeId = db
      .prepare("SELECT theme_id FROM enum_theme_family WHERE theme = ?")
      .get(theme);
    if (!themeId) {
      return null;
    }
    return themeId.theme_id;
  } catch (err) {
    return false;
  }
};
async function getProjects(req, res) {
  try {
    const projects = db
      .prepare(
        `SELECT
          p.project_id,
          p.name,
          p.description,
          p.type,
          p.language,
          p.path,
          p.entry,
          p.port,
          p.domain,
          t.theme AS theme_name,
          a.direction,
          a.criticality
      FROM projects p
      LEFT JOIN axes a ON p.project_id = a.project_id
      LEFT JOIN enum_theme_family t ON a.theme_id = t.theme_id;`
      )
      .all();

    if (projects.length === 0) {
      return res.json({ success: false });
    }

    let open_id_count = 0;

    // Use Promise.all to fetch statuses concurrently for better performance
    await Promise.all(
      projects.map(async (project) => {
        // Set safe defaults for all projects
        project.status = "stopped";
        project.process_id = 0;

        // Only query the Go spawner for background 'linger' processes
        if (project.type === "linger") {
          try {
            const response = await fetch("http://localhost:9000/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ project_id: project.project_id }),
            });

            const temp_res = await response.json();

            // Inject the Go backend data directly into the SQLite project object
            project.status = temp_res.status;
            project.process_id = temp_res.process_id;

            if (temp_res.process_id !== 0) {
              open_id_count += 1;
            }
          } catch (err) {
            console.error(`Status check failed for project ${project.project_id}:`, err);
            // It safely falls back to the "stopped" defaults set above
          }
        }
      })
    );

    // The 'projects' array now contains the live status and process_id for every item
    return res.json({ success: true, projects, open_id_count });
  } catch (err) {
    return res.json({ error: err.toString() });
  }
}

async function getProject(req, res) {
  const { projectId } = req.vparams;
  try {

    const project = db
      .prepare(
        `SELECT
        p.project_id,
        p.name,
        p.description,
        p.type,
        p.language,
        p.path,
        p.entry,
        p.port,
        p.domain,
        t.theme AS theme_name,
        a.direction,
        a.criticality
    FROM projects p
    LEFT JOIN axes a ON p.project_id = a.project_id
    LEFT JOIN enum_theme_family t ON a.theme_id = t.theme_id
    WHERE p.project_id = ?`,
      )
      .get(projectId);
    if (project.length === 0) {
      return res.json({ success: false });
    }
    return res.json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
function postProjects(req, res) {
  const {
    name,
    description,
    type,
    language,
    path,
    entry,
    domain,
    port,
    theme,
    direction,
    criticality,
  } = req.vbody;

  try {
    const themeId = checkTheme(theme);
    if (!themeId) {
      return res.status(400).json({ err: "Invalid theme" });
    }

    const newProject = db
      .prepare(
        `INSERT INTO projects
         (name, description, type, language, path, entry, domain, port, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        name,
        description,
        type,
        language,
        path,
        entry,
        domain,
        port,
        "stopped",
      );

    const newProjectId = newProject.lastInsertRowid;

    db.prepare(
      `INSERT INTO axes (project_id, theme_id, direction, criticality)
       VALUES (?, ?, ?, ?)`,
    ).run(newProjectId, themeId, direction, criticality);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function updateProject(req, res) {
  const { projectId } = req.vparams,
    initialUpdates = req.vbody,
    {
      name,
      description,
      type,
      language,
      path,
      entry,
      port,
      domain,
      theme,
      ...rest
    } = initialUpdates,
    projectsJson = {
      name,
      description,
      type,
      language,
      path,
      entry,
      port,
      domain,
    },
    themeJson = rest,
    projectFields = Object.keys(projectsJson),
    themeFields = Object.keys(themeJson),
    themeId = checkTheme(theme);

  if (projectsJson.length === 0 || themeJson.length === 0)
    return res.status(400).json({ error: "at least one field is required" });

  try {
    const projects = projectFields.map((field) => `${field} = ?`).join(", "),
      projectResult = db
        .prepare(`UPDATE projects SET ${projects} WHERE project_id = ?`)
        .run(...projectFields.map((field) => projectsJson[field]), projectId);

    if (projectResult.changes === 0)
      return res.status(404).json({ error: "project not found" });

    const themes = themeFields.map((field) => `${field} = ?`).join(", "),
      axesResult = db
        .prepare(`UPDATE axes SET ${themes} WHERE project_id = ?`)
        .run(...themeFields.map((field) => themeJson[field]), projectId),
      themeResult = db
        .prepare(`UPDATE axes set theme_id = ? where project_id = ?`)
        .run(themeId, projectId);

    if (themeResult.changes === 0 || axesResult.changes === 0)
      return res.status(404).json({ error: "project not found" });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function deleteProject(req, res) {
  const { projectId } = req.vparams;
  try {
    db.prepare("DELETE FROM projects WHERE project_id = ?").run(projectId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

async function searchPorts(req, res) {
  try {
    const ports = db
        .prepare("SELECT project_id FROM projects where type = 'linger'")
        .all(),
      projectIds = ports.map((item) => item.project_id);
    var open_ports = {};
    for (i in projectIds) {
      const response = await fetch("http://localhost:9000/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectIds[i],
        }),
      });
      const temp_res = await response.json();
      if (temp_res.process_id != 0) {
        const { port } = db
            .prepare("SELECT port FROM projects where project_id = ?")
            .get(temp_res.project_id),
          process_id = temp_res.process_id;
        open_ports[port] = process_id.toString();
      }
    }
    return res.json(open_ports);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function openProject(req, res) {
  return await system(req, res, "http://localhost:9000/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

async function launchProject(req, res) {
  return await system(req, res, "http://localhost:9000/spawn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

async function stopProject(req, res) {
  if (process.env.HARBINGER) {
  const executablePath = process.env.HARBINGER_BIN;
  execFile(executablePath, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    console.log(`Executable output:\n${stdout}`);
  });
  }
  return await system(req, res, "http://localhost:9000/kill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

async function statusProject(req, res) {
  return await system(req, res, "http://localhost:9000/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

async function stopDanglingProject(req, res) {
  const lua_scanned = req.body,
    ports = Object.keys(lua_scanned),
    placeholders = ports.map(() => "?").join(", ");

  try {
    const projects = db
      .prepare(
        `SELECT project_id, port from projects where port in (${placeholders})`,
      )
      .all(...ports);
    const db_ports = projects.map((projects) => projects.port),
      db_project = projects.map((projects) => projects.project_id),
      uncontrolled_ports = ports.filter((port) => !db_ports.includes(port)),
      stopped_process = [];
    console.log(db_project);

    for (const i in db_project) {
      const response = await fetch("http://localhost:9000/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: db_project[i],
        }),
      });
      const res_text = await response.json();
      if (!response.ok) {
        return res.status(500).json({ res_text });
      }
      stopped_process.push(res_text);
    }
    return res.json({
      uncontrolled_ports,
      db_ports,
      stopped_process,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function streamLogs(req, res) {
  const { projectId } = req.params,
    logPath = path.join(__dirname, `../marshal/logs/project_${projectId}.log`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!fs.existsSync(logPath)) {
    res.write(`data: [no log file found]\n\n`);
    res.end();
    return;
  }

  const existing = fs.readFileSync(logPath, "utf8");
  existing
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      res.write(`data: ${line}\n\n`);
    });

  const watcher = fs.watch(logPath, () => {
    const stream = fs.createReadStream(logPath, {
      encoding: "utf8",
      start: lastPos,
    });

    stream.on("data", (chunk) => {
      chunk
        .split("\n")
        .filter(Boolean)
        .forEach((line) => {
          res.write(`data: ${line}\n\n`);
        });
      lastPos += Buffer.byteLength(chunk, "utf8");
    });
  });

  let lastPos = Buffer.byteLength(existing, "utf8");

  req.on("close", () => {
    watcher.close();
  });
}

function archiveProject(req, res) {
  const { projectId } = req.vparams;
  try {
    const isProject = db
      .prepare("SELECT 1 FROM projects WHERE project_id = ?")
      .get(projectId);
    if (!isProject) {
      return res
        .status(404)
        .json({ success: false, message: "No projects found" });
    }
    const selectProject = db
        .prepare(
          "SELECT project_id, name, description, type, language, path, entry, port, domain, status FROM projects WHERE project_id = ?",
        )
        .get(projectId),
      selectProjectArr = Object.values(selectProject);

    const insertProject = db
      .prepare(
        "INSERT INTO archive (project_id, name, description, type, language, path, entry, port, domain, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...selectProjectArr);
    if (insertProject.lastInsertRowid == 0) {
      return res
        .status(500)
        .json({ success: false, message: "Table could not have archived" });
    }
    const deleteProject = db
      .prepare("DELETE FROM projects WHERE project_id = ?")
      .run(projectId);
    return res.json({ success: true });
  } catch (err) {
    return res.json({ error: err.message });
  }
}

function getArchives(req, res) {
  try {
    const archives = db
      .prepare(
        "SELECT project_id, name, description, type, language, path, entry, port, domain, status from archive",
      )
      .all();
    return res.json({ success: true, archives });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function getArchive(req, res) {
  const { projectId } = req.vparams;
  try {
    const archive = db
      .prepare(
        "SELECT project_id, name, description, type, language, path, entry, port, domain, status from archive where project_id = ?",
      )
      .get(projectId);
    return res.json({ success: true, archive });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function unarchive(req, res) {
  const { projectId } = req.vparams;
  try {
  const selectProject = db
    .prepare(
      "SELECT project_id, name, description, type, language, path, entry, port, domain, status FROM archive WHERE project_id = ?",
    )
    .get(projectId),
      selectProjectArr = Object.values(selectProject);

      if (!selectProject) {
        return res
          .status(404)
          .json({ success: false, message: "No projects found" });
      }
    const dbTransaction = db.transaction((id) => {
      const deleteArchive = db.prepare("DELETE FROM archive WHERE project_id = ?").run(id);
      if (deleteArchive.changes == 0) {
        throw new Error
      }
      const insertProject = db.prepare(`INSERT INTO projects(project_id, name, description, type, language, path, entry, domain, port, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...selectProjectArr)
      if (insertProject.changes == 0) {
        throw new Error
      }
      return true
    })
    dbTransaction(projectId);

    return res.json({ success: true, selectProject });
  } catch (err) {
    return res.status(500).json({ error: err.message});
  }
}

function deleteArchive(req, res) {
  const { projectId } = req.vparams;
  try {
    const archive = db
      .prepare(
        "SELECT project_id, name, description, type, language, path, entry, port, domain, status from archive where project_id = ?",
      )
      .get(projectId);
    return res.json({ success: true, archive });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}



module.exports = {
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
};
