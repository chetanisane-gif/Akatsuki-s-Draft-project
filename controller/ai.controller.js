import { improvePostContent, generateDraftFromTopic } from "../services/ai.services.js";
import Post from "../model/post.model.js";

/**
 * Improve draft content with AI
 * Body can accept { title, description, content, tone, postId }
 */
export const improveContent = async (req, res) => {
  try {
    let { title, description, content, tone = "engaging", postId } = req.body;

    // If a postId is supplied, retrieve the user's post content automatically
    if (postId) {
      const existingPost = await Post.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: "Post not found with the provided postId",
        });
      }
      if (!existingPost.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "You can only improve posts you created",
        });
      }
      title = title || existingPost.title;
      description = description || existingPost.description;
      content = content || existingPost.content;
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required to perform AI enhancement",
      });
    }

    const improvedResult = await improvePostContent({
      title,
      description,
      content,
      tone,
    });

    return res.status(200).json({
      success: true,
      message: "Content improved successfully with Gemini AI",
      data: improvedResult,
    });
  } catch (error) {
    console.error("AI Improve Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to improve content with AI",
    });
  }
};

/**
 * Generate a complete new post draft using AI based on a topic
 */
export const generateDraft = async (req, res) => {
  try {
    const { topic, category = "General", keyPoints = "" } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Topic is required to generate a draft",
      });
    }

    const draft = await generateDraftFromTopic({
      topic,
      category,
      keyPoints,
    });

    return res.status(200).json({
      success: true,
      message: "Post draft generated successfully with Gemini AI",
      draft,
    });
  } catch (error) {
    console.error("AI Generate Draft Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate draft with AI",
    });
  }
};
