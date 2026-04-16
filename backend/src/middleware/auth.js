const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token" });
  }
}

module.exports = { authMiddleware };

