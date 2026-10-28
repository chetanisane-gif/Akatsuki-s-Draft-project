import axios from "axios";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Call Google Gemini API using Axios REST API.
 * Uses gemini-1.5-flash by default for fast, cost-effective, high-quality responses.
 */
export const callGemini = async (prompt, model = "gemini-1.5-flash") => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your Google Gemini API key to your .env file."
    );
  }

  const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(
      endpoint,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response candidates returned from Gemini API");
    }

    const textContent = candidates[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error("Empty text returned from Gemini API");
    }

    return textContent;
  } catch (error) {
    if (error.response) {
      console.error("Gemini API Error Status:", error.response.status);
      console.error("Gemini API Error Data:", error.response.data);
      const apiMessage = error.response.data?.error?.message || error.response.statusText;
      throw new Error(`Gemini API Error: ${apiMessage}`);
    }
    throw error;
  }
};
