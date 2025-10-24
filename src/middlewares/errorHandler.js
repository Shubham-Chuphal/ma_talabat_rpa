// src/middlewares/errorHandler.js

const { config } = require("../config");

const authCheck = (req, res, next) => {
  const accessKey = req.headers["x-talabat-access-key"];
  const secretKey = req.headers["x-talabat-secret-key"];

  if (
    accessKey !== config.talabat.accessKey ||
    secretKey !== config.talabat.secretKey
  ) {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized request" });
  }

  next();
};

// 404 Not Found Middleware
const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
};

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = { authCheck, notFound, errorHandler };
