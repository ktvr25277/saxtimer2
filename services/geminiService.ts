import { GoogleGenAI } from "@google/genai";
import { FALLBACK_ADVICE } from "../constants";

export const getPersonalizedAdvice = async (totalSeconds: number): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("API Key not found, using fallback.");
    return getRandomFallback();
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  const prompt = `
  You are a world-class professional Soprano Saxophone instructor.
  Your student has practiced for a total of ${hours} hours and ${minutes} minutes.
  
  Based on this experience level, give ONE short, specific, and encouraging piece of technical or musical advice.
  Maximum 100 characters (Japanese).
  Focus on tone quality, intonation, or posture suited for this level.
  Do not just say "Good job", give actionable advice.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text;
    if (text) {
      return text.trim();
    } else {
      throw new Error("Empty response");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getRandomFallback();
  }
};

const getRandomFallback = (): string => {
  const index = Math.floor(Math.random() * FALLBACK_ADVICE.length);
  return FALLBACK_ADVICE[index];
};
