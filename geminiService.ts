

import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
export const textModel = 'gemini-2.5-flash';
export const imageModel = 'imagen-3.0-generate-002';

export class GeminiError extends Error {
    public isQuotaError: boolean;
    public isInvalidInputError: boolean;

    constructor(message: string, public originalError: any) {
        super(message);
        this.name = 'GeminiError';
        // console.error(`Gemini Error in ${message}:`, originalError); // Removing this to prevent raw error logging. UI toasts will handle user notification.
        const errorMessage = this.originalError?.message?.toLowerCase() || '';
        this.isQuotaError = (errorMessage.includes('429') || errorMessage.includes('resource_exhausted'));
        this.isInvalidInputError = errorMessage.includes('invalid input') || errorMessage.includes('invalid argument');
    }
}
