const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

require("dotenv").config();

const app = express();

// DB connection
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
const testRoutes = require("./routes/test.routes");
app.use("/api/test", testRoutes);
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

app.use(limiter);

app.get("/", (req, res) => {
  res.json({ message: "Taskflow API Running" });
});

module.exports = app;
