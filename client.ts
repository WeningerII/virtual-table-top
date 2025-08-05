import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set. AI features will be disabled.");
}

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
export const textModel = 'gemini-2.5-flash';
export const imageModel = 'imagen-3.0-generate-002';