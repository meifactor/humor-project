import "server-only";
import { createPartFromBase64, GoogleGenAI } from "@google/genai";

export const CAPTION_COUNT = 5;
const MAX_CAPTION_LENGTH = 300;

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-flash-latest";
}

// The full prompt is saved with each generation, so keep it deterministic.
export function buildCaptionPrompt(context: string | null) {
  const lines = [
    "You write captions for a humor app used by Columbia University students in New York City.",
    "The audience is college students who are very online, many of them new to NYC, living in the dorms and exploring the city on weekends.",
    `Write ${CAPTION_COUNT} different funny captions for the attached photo.`,
    "",
    "Rules:",
    "- Each caption is a single line under 120 characters, like a meme caption or a post.",
    "- Mix styles: observational, relatable college life, NYC-specific, absurd, deadpan.",
    "- Base the humor on what is actually in the photo.",
    "- Keep it playful: no insults about anyone's appearance, race, religion, gender, sexuality or disability, no slurs, nothing sexual.",
    "- No hashtags. Only use an emoji if it is part of the joke.",
  ];

  if (context) {
    lines.push("", `The person who uploaded the photo added this context: "${context}"`);
  }

  return lines.join("\n");
}

export async function generateCaptions(
  image: { base64: string; mimeType: string },
  prompt: string,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: [createPartFromBase64(image.base64, image.mimeType), prompt],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          captions: {
            type: "array",
            items: { type: "string" },
            minItems: CAPTION_COUNT,
            maxItems: CAPTION_COUNT,
          },
        },
        required: ["captions"],
      },
    },
  });

  const parsed: unknown = JSON.parse(response.text ?? "{}");
  const raw =
    parsed && typeof parsed === "object" && "captions" in parsed
      ? (parsed as { captions: unknown }).captions
      : null;

  const captions = (Array.isArray(raw) ? raw : [])
    .filter((caption): caption is string => typeof caption === "string")
    .map((caption) => caption.trim().slice(0, MAX_CAPTION_LENGTH))
    .filter(Boolean)
    .slice(0, CAPTION_COUNT);

  if (captions.length === 0) {
    throw new Error("Gemini returned no captions");
  }

  // The exact model version that answered (the configured name may be an alias).
  return { captions, model: response.modelVersion ?? getGeminiModel() };
}
