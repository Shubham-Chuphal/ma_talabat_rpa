require("./scheduler/cronJobs");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { config } = require("./config");
const { port, env } = config;
const v1Routes = require("./routes/v1/index.routes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const talabatClientConfig = require("./middleware/talabatClientConfig");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env === "development") app.use(morgan("dev"));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Routes
// Attach Talabat client config globally (reads clientId and sets req.talabatClient)
app.use(talabatClientConfig);

console.log("M<<<<<<<,");
app.use("/api/v1", v1Routes);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(port, () =>
  console.log(`Server running on port:${port}`)
);

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("\nGracefully shutting down...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
