import Post from "../model/post.model.js";
import User from "../model/auth.model.js";

// Get all posts with optional status filtering and stats
export const getAllPosts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && ["draft", "pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Post.countDocuments(filter);

    const posts = await Post.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Summary statistics for admin dashboard
    const stats = {
      total: await Post.countDocuments(),
      pending: await Post.countDocuments({ status: "pending" }),
      approved: await Post.countDocuments({ status: "approved" }),
      rejected: await Post.countDocuments({ status: "rejected" }),
      draft: await Post.countDocuments({ status: "draft" }),
    };

    return res.status(200).json({
      success: true,
      stats,
      count: posts.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      posts,
    });
  } catch (error) {
    console.error("Admin Get Posts Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Moderate / update post status (e.g. approve or reject)
export const updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["draft", "pending", "approved", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    post.status = status;
    await post.save();

    return res.status(200).json({
      success: true,
      message: `Post status updated to '${status}' successfully`,
      post,
    });
  } catch (error) {
    console.error("Admin Update Post Status Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// List all registered users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin Get Users Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete any post as admin
export const deletePostAsAdmin = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted by admin successfully",
    });
  } catch (error) {
    console.error("Admin Delete Post Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
