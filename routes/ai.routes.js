import express from "express";
import { improveContent, generateDraft } from "../controller/ai.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Both AI endpoints require authentication
router.post("/improve", authMiddleware, improveContent);
router.post("/generate", authMiddleware, generateDraft);

export default router;
