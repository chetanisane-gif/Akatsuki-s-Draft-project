import express from "express";
import {
  getAllPosts,
  updatePostStatus,
  getAllUsers,
  deletePostAsAdmin,
} from "../controller/admin.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes in admin require authentication AND admin role
router.use(authMiddleware, adminMiddleware);

// Get all posts (with filtering by status)
router.get("/posts", getAllPosts);

// Update status of post (approve / reject / draft / pending)
router.patch("/posts/:id/status", updatePostStatus);

// List all users
router.get("/users", getAllUsers);

// Delete any post as admin
router.delete("/posts/:id", deletePostAsAdmin);

export default router;
