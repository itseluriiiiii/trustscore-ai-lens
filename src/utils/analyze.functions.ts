import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  input: z.string().min(1).max(5000),
  type: z.enum(["url", "review"]),
});

export type AnalysisResult = {
  trustScore: number;
  riskLevel: "low" | "medium" | "high";
  recommendation: "Safe" | "Caution" | "Avoid";
  warnings: string[];
  explanation: string;
  categories: {
    reviewAuthenticity: number;
    behavioralPatterns: number;
    networkAnalysis: number;
    websiteLegitimacy: number;
    contactValidation: number;
  };
};

export const analyzeInput = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const systemPrompt = `You are CheckMate AI, a Trust Intelligence Engine. Analyze the provided ${data.type === "url" ? "website URL" : "review text"} and return a JSON assessment.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "trustScore": <number 0-100>,
  "riskLevel": "<low|medium|high>",
  "recommendation": "<Safe|Caution|Avoid>",
  "warnings": ["<warning1>", "<warning2>", ...],
  "explanation": "<2-3 sentence summary using probabilistic language>",
  "categories": {
    "reviewAuthenticity": <number 0-100>,
    "behavioralPatterns": <number 0-100>,
    "networkAnalysis": <number 0-100>,
    "websiteLegitimacy": <number 0-100>,
    "contactValidation": <number 0-100>
  }
}

Rules:
- Use probabilistic language ("may indicate", "suggests", "appears to")
- Never make definitive accusations
- Consider domain age signals, TLD reputation, content patterns
- For reviews: check for generic language, excessive superlatives, repetitive phrasing, AI-generated patterns
- For URLs: check domain structure, TLD, brand impersonation signals
- Be helpful and fair — legitimate sites should score high`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this ${data.type}: ${data.input}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Rate limited. Please try again shortly.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please add funds.");
      throw new Error("AI analysis failed");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as AnalysisResult;
      return parsed;
    } catch {
      throw new Error("Failed to parse analysis results");
    }
  });
