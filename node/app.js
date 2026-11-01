require("dotenv").config();
const express = require("express"),
  cors = require("cors"),
  helmet = require("helmet"),
  cookieParser = require("cookie-parser"),
  path = require("path");

const projectRoute = require(path.join(__dirname, "routes/project.js")),
  imageRoute = require(path.join(__dirname, "routes/image.js"));

const PORT = process.env.PORT || 3179,
  ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const app = express();

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS Middleware
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);

// More Security
app.disable("x-powered-by");
app.set("trust proxy", true);

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", projectRoute);
app.use("/files", imageRoute);
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/health", (req, res) => {
  return res.json({ success: true, message: "Server is working fine" });
});

// App Listener
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
