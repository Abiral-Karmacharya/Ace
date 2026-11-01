const express = require("express");

function validateBody(schema, { partial = false } = {}) {
  return (req, res, next) => {
    const src = req.body ?? {};

    for (const key of ["__proto__", "constructor", "prototype"]) {
      if (Object.prototype.hasOwnProperty.call(src, key))
        return res.status(400).json({ error: "malformed body" });
    }

    const clean = {};
    for (const [field, rule] of Object.entries(schema)) {
      // A partial body (used by PATCH endpoints) should only validate fields
      // that the client actually sent.  This keeps omitted fields unchanged.
      if (partial && !Object.prototype.hasOwnProperty.call(src, field)) {
        continue;
      }
      const raw = src[field];

      if (raw == null || raw === "") {
        if (rule.required)
          return res.status(400).json({ error: `${field} is required` });
        clean[field] = null;
        continue;
      }

      if (rule.type === "int") {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 0)
          return res
            .status(400)
            .json({ error: `${field} must be a whole number` });
        clean[field] = n;
        continue;
      }

      if (rule.type === "fileArray") {
        if (!Array.isArray(raw))
          return res
            .status(400)
            .json({ error: `${field} must be a list of files` });
        if (rule.maxItems && raw.length > rule.maxItems)
          return res.status(400).json({
            error: `${field} has too many files (max ${rule.maxItems})`,
          });
        const files = [];
        for (const f of raw) {
          if (typeof f !== "object" || f === null)
            return res
              .status(400)
              .json({ error: `${field} entries must be objects` });
          if (typeof f.path !== "string" || typeof f.content !== "string")
            return res
              .status(400)
              .json({ error: `${field} entries need string path and content` });
          const path = f.path.trim();
          const content = f.content;
          if (!path)
            return res
              .status(400)
              .json({ error: `${field} entry has an empty path` });
          if (rule.maxContent && content.length > rule.maxContent)
            return res.status(400).json({
              error: `file ${path} too long (max ${rule.maxContent})`,
            });
          files.push({ path, content });
        }
        clean[field] = files;
        continue;
      }

      if (typeof raw !== "string")
        return res.status(400).json({ error: `${field} must be text` });
      const value = raw.trim();
      if (rule.min && value.length < rule.min)
        return res.status(400).json({
          error: `${field} must be at least ${rule.min} characters`,
        });
      if (rule.max && value.length > rule.max)
        return res
          .status(400)
          .json({ error: `${field} too long (max ${rule.max})` });
      if (rule.pattern && !rule.pattern.test(value))
        return res
          .status(400)
          .json({ error: `${field} has an invalid format` });
      clean[field] = value;
    }

    req.vbody = clean;
    next();
  };
}

// --- PARAMS: always-present strings; int + string + pattern only ---
function validateParams(schema) {
  return (req, res, next) => {
    const src = req.params ?? {};
    const clean = {};
    for (const [field, rule] of Object.entries(schema)) {
      const raw = src[field];

      if (raw == null || raw === "") {
        if (rule.required)
          return res.status(400).json({ error: `${field} is required` });
        clean[field] = null;
        continue;
      }

      if (rule.type === "int") {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 0)
          return res
            .status(400)
            .json({ error: `${field} must be a whole number` });
        clean[field] = n;
        continue;
      }

      // params are always strings from Express
      const value = String(raw).trim();
      if (rule.max && value.length > rule.max)
        return res
          .status(400)
          .json({ error: `${field} too long (max ${rule.max})` });
      if (rule.pattern && !rule.pattern.test(value))
        return res
          .status(400)
          .json({ error: `${field} has an invalid format` });
      clean[field] = value;
    }
    req.vparams = clean;
    next();
  };
}

// --- QUERY: reject non-strings up front (HPP), then int + string + pattern ---
function validateQuery(schema) {
  return (req, res, next) => {
    const src = req.query ?? {};
    const clean = {};
    for (const [field, rule] of Object.entries(schema)) {
      const raw = src[field];

      if (raw == null || raw === "") {
        if (rule.required)
          return res.status(400).json({ error: `${field} is required` });
        clean[field] = null;
        continue;
      }

      // HPP guard: ?x=1&x=2 → array, ?x[y]=1 → object. Fail closed, by design.
      if (typeof raw !== "string")
        return res
          .status(400)
          .json({ error: `${field} must be a single value` });

      if (rule.type === "int") {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 0)
          return res
            .status(400)
            .json({ error: `${field} must be a whole number` });
        clean[field] = n;
        continue;
      }

      const value = raw.trim();
      if (rule.min && value.length < rule.min)
        return res
          .status(400)
          .json({ error: `${field} must be at least ${rule.min} characters` });
      if (rule.max && value.length > rule.max)
        return res
          .status(400)
          .json({ error: `${field} too long (max ${rule.max})` });
      if (rule.pattern && !rule.pattern.test(value))
        return res
          .status(400)
          .json({ error: `${field} has an invalid format` });
      clean[field] = value;
    }
    req.vquery = clean;
    next();
  };
}
function bodyLimit(limit) {
  return express.json({ limit });
}

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
  bodyLimit,
};
