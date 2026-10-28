import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import aiRoutes from "./routes/ai.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Connect to MongoDB on startup
connectDB();

// Ensure MongoDB is connected for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection error in middleware:", error.message);
  }
  next();
});

// Primary API routes (Cold Mailer style)
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

// Direct alias routes for flexible client/testing compliance (e.g. /auth/register)
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/admin", adminRoutes);
app.use("/ai", aiRoutes);

// Root health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "PostEvent API — Akatsuki's Draft",
    message: "AI-Enabled Content Sharing Platform API is running",
    endpoints: {
      auth: "/api/auth",
      posts: "/api/posts",
      admin: "/api/admin",
      ai: "/api/ai",
      health: "/health",
    },
  });
});

// Dedicated health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
    error: err.message,
  });
});

// Start local HTTP server when not in Vercel serverless environment
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port : ${PORT}`);
    console.log(`📡 Health check available at: http://localhost:${PORT}/health`);
  });
}

// Export default app for Vercel serverless deployment
export default app;
