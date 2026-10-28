import { callGemini } from "../utils/gemini.utils.js";

/**
 * Clean markdown code block markers from an AI response and parse as JSON
 */
const parseCleanJson = (aiResponse) => {
  const cleaned = aiResponse
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Try extracting the first valid JSON block if there is surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const toParse = jsonMatch ? jsonMatch[0] : cleaned;

  return JSON.parse(toParse);
};

/**
 * Improve an existing post's title, description, and content with AI
 */
export const improvePostContent = async ({
  title = "",
  description = "",
  content = "",
  tone = "engaging",
}) => {
  const prompt = `
You are an expert content editor and copywriter for an online article and event sharing platform called PostEvent (Akatsuki's Draft).

Analyze and significantly improve the following draft content.

DRAFT DETAILS:
- Title: ${title || "Untitled"}
- Description: ${description || "None provided"}
- Content:
${content}
- Desired Tone: ${tone}

TASK:
1. Polish the grammar, sentence structure, flow, and clarity.
2. Structure the content with markdown formatting (clear headings, bullet points, code blocks or quotes where relevant).
3. Create a captivating, clickable title that matches the tone.
4. Craft a concise 1-2 sentence preview description (max 150 characters).
5. Provide a short 2-3 sentence explanation of the specific improvements made.

RULES:
- Maintain the original meaning and technical accuracy.
- Return ONLY valid JSON without conversational filler or markdown backticks outside JSON.

EXACT JSON FORMAT:
{
  "improvedTitle": "Polished and captivating title",
  "improvedDescription": "Concise 1-2 sentence summary description",
  "improvedContent": "Full formatted improved markdown content",
  "improvementsSummary": "Brief overview of what was polished"
}
`;

  const aiText = await callGemini(prompt);

  try {
    const result = parseCleanJson(aiText);
    return result;
  } catch (error) {
    console.error("Failed to parse Gemini JSON response:", aiText);
    // Fallback: return raw improved text
    return {
      improvedTitle: title,
      improvedDescription: description,
      improvedContent: aiText,
      improvementsSummary: "Content enhanced by Gemini (raw response format)",
    };
  }
};

/**
 * Generate a complete post draft from a topic and rough notes
 */
export const generateDraftFromTopic = async ({
  topic,
  category = "Technology",
  keyPoints = "",
}) => {
  const prompt = `
You are an expert article writer for PostEvent (Akatsuki's Draft).

Create a high quality, ready-to-publish post draft based on the following input:
- Topic: ${topic}
- Category: ${category}
- Key Points to cover: ${keyPoints || "Provide comprehensive coverage of this topic"}

TASK:
Write an engaging post formatted in clean Markdown.

RULES:
- Return ONLY valid JSON.
- Ensure the article has an introductory hook, structured body sections with headings, and a concluding takeaway.

EXACT JSON FORMAT:
{
  "title": "Engaging Article Title",
  "description": "Short 1-2 sentence hook for the feed",
  "content": "Full article body in Markdown with headings and paragraphs",
  "category": "${category}"
}
`;

  const aiText = await callGemini(prompt);

  try {
    return parseCleanJson(aiText);
  } catch (error) {
    console.error("Failed to parse Gemini draft JSON:", aiText);
    return {
      title: topic,
      description: `Article about ${topic}`,
      content: aiText,
      category,
    };
  }
};
