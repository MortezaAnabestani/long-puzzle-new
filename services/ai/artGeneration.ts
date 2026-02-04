/**
 * Documentary Puzzle Studio — Art Generation Service
 *
 * دو فکشن:
 *   generateSingleImage   → یک تصویر واحد (internal، batch استفاده میکنه)
 *   generateChapterImages → batch: هر فصل یک تصویر، progress callback داره
 */

import { GoogleGenAI } from "@google/genai";
import { Chapter } from "../../types";
import { BatchImageGenerationResponse, BatchImageResult, BatchProgressEvent } from "../types/serviceTypes";

// ─── SINGLE IMAGE (internal) ─────────────────────────────────────────

/**
 * یک تصویر واحد میسازه.
 * prompt کاملاً از بیرون میاد — masterStylePrompt قبلاً بهش اضافه شده.
 */
const generateSingleImage = async (fullPrompt: string, attempt: number = 0): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `${fullPrompt}

9:16 vertical aspect ratio. 4K resolution feel. Professional cinematic lighting, high contrast, clean composition. Documentary visual style.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: prompt }] }],
      config: { imageConfig: { aspectRatio: "9:16" } },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data in response");
  } catch (error: any) {
    if (attempt < 2) return generateSingleImage(fullPrompt, attempt + 1);
    throw error;
  }
};

// ─── BATCH IMAGE GENERATION ──────────────────────────────────────────

/**
 * فصل‌ها رو یکی یکی تصویر میسازه.
 * هر فصل: prompt = masterStylePrompt + chapter.imagePrompt
 * progress callback هر فصل صدا میشه.
 *
 * @param chapters           فصل‌های پروژه
 * @param masterStylePrompt  سبل بصری کل پروژه
 * @param onProgress         هر فصل تموم شد صدا میشه
 */
export const generateChapterImages = async (
  chapters: Chapter[],
  masterStylePrompt: string,
  onProgress?: (event: BatchProgressEvent) => void
): Promise<BatchImageGenerationResponse> => {
  const results: BatchImageResult[] = [];
  let completedCount = 0;

  for (const chapter of chapters) {
    onProgress?.({
      type: "chapter_started",
      chapterIndex: chapter.index,
      totalChapters: chapters.length,
      completedCount,
    });

    try {
      const fullPrompt = `${masterStylePrompt}\n\nScene: ${chapter.imagePrompt}`;
      const imageUrl = await generateSingleImage(fullPrompt);
      completedCount++;

      results.push({
        chapterId: chapter.id,
        chapterIndex: chapter.index,
        imageUrl,
        status: "success",
      });

      onProgress?.({
        type: "chapter_completed",
        chapterIndex: chapter.index,
        totalChapters: chapters.length,
        completedCount,
        imageUrl,
      });
    } catch (error: any) {
      results.push({
        chapterId: chapter.id,
        chapterIndex: chapter.index,
        imageUrl: "",
        status: "failed",
        error: error.message ?? "Image generation failed",
      });

      onProgress?.({
        type: "chapter_failed",
        chapterIndex: chapter.index,
        totalChapters: chapters.length,
        completedCount,
      });
    }
  }

  onProgress?.({
    type: "all_completed",
    chapterIndex: chapters.length - 1,
    totalChapters: chapters.length,
    completedCount,
  });

  return {
    results,
    totalGenerated: results.filter((r) => r.status === "success").length,
    totalFailed: results.filter((r) => r.status === "failed").length,
  };
};
