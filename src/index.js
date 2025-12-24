const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

// =========================
// App Initialization
// =========================
const app = express();

app.use(helmet());
app.use(cors({ origin: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =========================
// Environment
// =========================
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing");
  process.exit(1);
}

// =========================
// PostgreSQL Connection
// =========================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool
  .connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch((err) => {
    console.error("❌ PostgreSQL connection error:", err);
    process.exit(1);
  });

// =========================
// Routes
// =========================

// Root – basic check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "matbakh-alyoum-backend",
    environment: process.env.NODE_ENV || "development",
  });
});

// Healthcheck – REQUIRED for Railway
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Test DB connection
app.get("/api/ping", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("❌ DB query error:", error);
    res.status(500).json({ success: false });
  }
});

// =========================
// Global Error Protection
// =========================
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// =========================
// Start Server
// =========================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
