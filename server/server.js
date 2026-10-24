import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";

import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const SESSION_LIFETIME = 1000 * 60 * 60 * 24; // 24 hours

// CORS configuration.
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

// MySQL-backed session store.
const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  createDatabaseTable: false,

  schema: {
    tableName: "sessions",
    columnNames: {
      session_id: "session_id",
      expires: "expires",
      data: "data",
    },
  },

  // Session expiration and cleanup.
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: SESSION_LIFETIME,
});

// Express session middleware.
app.use(
  session({
    name: "auth.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_LIFETIME,
    },
  }),
);

// Root endpoint.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication API is running",
  });
});

// Server health check.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

// Database health check.
app.get("/api/db-health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");

    res.status(200).json({
      success: true,
      message: "Database connection successful",
      database: process.env.DB_NAME,
      testResult: rows[0].result,
    });
  } catch (error) {
    console.error("Database connection test failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Authentication routes.
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
