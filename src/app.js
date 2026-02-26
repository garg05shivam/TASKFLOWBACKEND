const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const sanitizeRequest = require("./middlewares/sanitize.middleware");
const { startTaskReminderWorker } = require("./services/reminder.service");

require("dotenv").config();

const app = express();

// DB connection
connectDB();
if (process.env.NODE_ENV !== "test" && process.env.ENABLE_TASK_REMINDERS !== "false") {
  startTaskReminderWorker();
}

const allowedOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URL_2].filter(Boolean);

// Middlewares
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(sanitizeRequest);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});
app.use(limiter);

const testRoutes = require("./routes/test.routes");
app.use("/api/test", testRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const projectRoutes = require("./routes/project.routes");
app.use("/api/projects", projectRoutes);

const taskRoutes = require("./routes/task.routes");
app.use("/api/tasks", taskRoutes);

const collaborationRoutes = require("./routes/collaboration.routes");
app.use("/api/collaboration", collaborationRoutes);

const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);

const { swaggerUi, specs } = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (req, res) => {
  res.json({ message: "Taskflow API Running" });
});

const errorHandler = require("./middlewares/error.middleware");
app.use(errorHandler);

module.exports = app;
