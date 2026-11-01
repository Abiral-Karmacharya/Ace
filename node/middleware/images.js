const multer = require("multer"),
  path = require("path"),
  crypto = require("crypto");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err);
      cb(null, "file_" + raw.toString("hex"));
    });
  },
});

const upload = multer({ storage });
module.exports = upload;
