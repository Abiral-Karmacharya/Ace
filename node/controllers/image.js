const path = require("path"),
  db = require(path.join(__dirname, "../db/db.js"));
const fs = require("fs");

function postFiles(req, res) {
  const file = req.file;
  const { domain } = req.body;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const original_name = file.originalname,
    path = file.destination,
    file_name = file.filename,
    mime = file.mimetype,
    full_path = file.path; // multer provides the complete path here

  try {
    // 1. Wrap database operations inside a strict transaction
    const insertImageTx = db.transaction((targetDomain) => {
      const project = db
        .prepare("SELECT project_id FROM projects WHERE domain = ?")
        .get(targetDomain);

      // Safe check: prevents destructuring crash if project isn't found
      if (!project) {
        throw new Error(`Project with domain '${targetDomain}' not found.`);
      }

      db.prepare(
        "INSERT INTO images (original_name, file_name, path, mime, project_id) VALUES (?, ?, ?, ?, ?)"
      ).run(original_name, file_name, path, mime, project.project_id);
    });

    // Execute the transaction
    insertImageTx(domain);

    return res.json({ success: true });
  } catch (err) {
    // 2. Filesystem Fallback: Delete the uploaded file to prevent storage leaks
    if (full_path && fs.existsSync(full_path)) {
      try {
        fs.unlinkSync(full_path);
      } catch (fsErr) {
        console.error(`Failed to delete orphaned file ${full_path}:`, fsErr);
      }
    }

    return res.status(500).json({ error: err.message });
  }
}

function getFiles(req, res) {
  try {
    const file = db
      .prepare(
        "SELECT images.file_name, projects.domain FROM images JOIN projects ON images.project_id = projects.project_id",
      )
      .all();
    return res.json({ success: true, file: file });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { postFiles, getFiles };
