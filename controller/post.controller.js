import Post from "../model/post.model.js";

// Create a new post (draft or pending)
export const createPost = async (req, res) => {
  try {
    const { title, description, content, image, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    // A regular user can only create a post as "draft" or submit it as "pending"
    let initialStatus = "draft";
    if (status === "pending") {
      initialStatus = "pending";
    }

    // createdBy is ALWAYS assigned from authenticated req.user._id
    const newPost = await Post.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      content,
      image: image || "",
      category: category ? category.trim() : "General",
      createdBy: req.user._id,
      status: initialStatus,
    });

    return res.status(201).json({
      success: true,
      message: `Post created successfully as ${initialStatus}`,
      post: newPost,
    });
  } catch (error) {
    console.error("Create Post Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all approved posts (Public feed)
export const getApprovedPosts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    const query = { status: "approved" };

    if (category) {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { content: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      posts,
    });
  } catch (error) {
    console.error("Get Approved Posts Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get current user's posts across all statuses (draft, pending, approved, rejected)
export const getMyPosts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { createdBy: req.user._id };

    if (status) {
      filter.status = status;
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.error("Get My Posts Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("createdBy", "name email");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // If post is not approved, only the author or an admin can access it
    if (post.status !== "approved") {
      const isAuthor = req.user && post.createdBy._id.equals(req.user._id);
      const isAdmin = req.user && req.user.role === "admin";

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden: Post is not publicly available yet",
        });
      }
    }

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Get Post By ID Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update an existing post (Author only)
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Ensure only the author can update their post
    if (!post.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this post",
      });
    }

    const { title, description, content, image, category, status } = req.body;

    if (title !== undefined) post.title = title.trim();
    if (description !== undefined) post.description = description.trim();
    if (content !== undefined) post.content = content;
    if (image !== undefined) post.image = image;
    if (category !== undefined) post.category = category.trim();

    // Authors can switch status between draft or submit as pending
    if (status === "draft" || status === "pending") {
      post.status = status;
    } else if (post.status === "rejected" && (title || content)) {
      // If editing a rejected post without explicit status, default back to draft
      post.status = "draft";
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Update Post Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Submit draft or rejected post for admin approval
export const submitPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!post.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to submit this post",
      });
    }

    post.status = "pending";
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post submitted for approval successfully",
      post,
    });
  } catch (error) {
    console.error("Submit Post Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete post (Author or Admin)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isAuthor = post.createdBy.equals(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this post",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete Post Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
