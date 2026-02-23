const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    const next = {};

    for (const [key, nested] of Object.entries(value)) {
      // Drop keys commonly used for NoSQL injection payloads.
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      next[key] = sanitizeValue(nested);
    }

    return next;
  }

  if (typeof value === "string") {
    // Keep input readable while removing obvious script tags.
    return value.replace(/<\s*\/??\s*script\b[^>]*>/gi, "").trim();
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  next();
};

module.exports = sanitizeRequest;
