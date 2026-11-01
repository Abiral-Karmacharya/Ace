const path = require("path"),
  app = require("express").Router(),
  { postFiles, getFiles } = require(
    path.join(__dirname, "../controllers/image.js"),
  ),
  upload = require(path.join(__dirname, "../middleware/images.js")),
  { validateParams } = require(
    path.join(__dirname, "../middleware/validation.js"),
  );

const ParamsRules = {
  fileId: {
    required: true,
  },
};

app.post("/upload", upload.single("file"), postFiles);
app.get("/get/", getFiles);

module.exports = app;
