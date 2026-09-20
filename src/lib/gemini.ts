import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey());
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateJson(params: {
  systemInstruction: string;
  userText: string;
  schema: unknown;
  timeoutMs?: number;
}): Promise<unknown> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ apiKey });
  const model = getGeminiModel();
  const timeoutMs = params.timeoutMs ?? 20_000;

  const run = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.userText,
        config: {
          temperature: 0.2,
          systemInstruction: params.systemInstruction,
          responseMimeType: "application/json",
          responseJsonSchema: params.schema,
          abortSignal: controller.signal,
          httpOptions: { timeout: timeoutMs },
        },
      });
      const text = response.text;
      if (!text) throw new Error("Empty model response");
      return JSON.parse(text) as unknown;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retryable = /429|invalid json|json|abort|timeout|empty/i.test(message);
    if (!retryable) throw error;
    await sleep(1000);
    return await run();
  }
}

export async function generateJsonFromParts(params: {
  systemInstruction: string;
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  schema: unknown;
  timeoutMs?: number;
}): Promise<unknown> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  const ai = new GoogleGenAI({ apiKey });
  const model = getGeminiModel();
  const timeoutMs = params.timeoutMs ?? 20_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: params.parts }],
      config: {
        temperature: 0.2,
        systemInstruction: params.systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: params.schema,
        abortSignal: controller.signal,
        httpOptions: { timeout: timeoutMs },
      },
    });
    const text = response.text;
    if (!text) throw new Error("Empty model response");
    return JSON.parse(text) as unknown;
  } finally {
    clearTimeout(timer);
  }
}
