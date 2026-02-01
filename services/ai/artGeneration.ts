/**
 * Art Generation AI Service
 *
 * Handles AI image generation for puzzle content
 */

import { GoogleGenAI } from "@google/genai";
import { ArtStyle } from "../../types";
import { ArtGenerationResponse } from "../types/serviceTypes";

export const generateArtImage = async (
  style: ArtStyle,
  subject: string,
  attempt: number = 0
): Promise<ArtGenerationResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Professional cinematic coloring studio art, high contrast, clean outlines. Theme: ${subject}. Style: ${style}. 9:16 vertical aspect ratio. 4k resolution feel.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: { imageConfig: { aspectRatio: "9:16" } }
    });

    let imageUrl = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    return { imageUrl };
  } catch (error: any) {
    if (attempt < 2) return generateArtImage(style, subject, attempt + 1);
    throw error;
  }
};
