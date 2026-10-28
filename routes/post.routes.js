import express from "express";
import {
  createPost,
  getApprovedPosts,
  getMyPosts,
  getPostById,
  updatePost,
  submitPost,
  deletePost,
} from "../controller/post.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public feed (only approved posts)
router.get("/", getApprovedPosts);

// Authenticated user's own posts
router.get("/my-posts", authMiddleware, getMyPosts);

// Create new post
router.post("/", authMiddleware, createPost);

// Get post by ID (public for approved; creator/admin for draft/pending/rejected)
router.get("/:id", optionalAuthMiddleware, getPostById);

// Update post (author only)
router.put("/:id", authMiddleware, updatePost);

// Submit post for admin review (changes status to pending)
router.patch("/:id/submit", authMiddleware, submitPost);

// Delete post (author or admin)
router.delete("/:id", authMiddleware, deletePost);

export default router;
