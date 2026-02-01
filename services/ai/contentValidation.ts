/**
 * Content Validation AI Service
 *
 * Handles semantic similarity checking and core subject extraction
 * to prevent repetitive content generation
 */

import { GoogleGenAI, Type } from "@google/genai";
import { StoryArc } from "../../types";
import { ContentSimilarityCheck } from "../types/serviceTypes";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extract the core subject from a content prompt
 * Returns a concise description of what the content is actually about
 */
export const extractCoreSubject = async (
  visualPrompt: string,
  storyArc: StoryArc,
  category: string
): Promise<string> => {
  const ai = getAIInstance();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this content and extract its CORE SUBJECT in a single concise sentence (max 100 characters).

Visual Prompt: "${visualPrompt}"
Story Hook: "${storyArc.hook}"
Story Reveal: "${storyArc.reveal}"
Category: ${category}

The core subject should capture:
1. The MAIN topic/phenomenon being discussed
2. The KEY unique aspect or angle
3. What makes THIS specific from similar topics

Examples:
- "Bioluminescent jellyfish generating electricity in deep ocean trenches"
- "Ancient pyramid's hidden water channels revealed through thermal imaging"
- "Quantum entanglement's role in bird migration navigation systems"

Return ONLY the core subject sentence, nothing else.`
    });

    const coreSubject = response.text?.trim() || visualPrompt.substring(0, 100);
    console.log(`🎯 Extracted core subject: "${coreSubject}"`);
    return coreSubject;
  } catch (error) {
    console.error('Failed to extract core subject:', error);
    return visualPrompt.substring(0, 100);
  }
};

/**
 * Check if a new content idea is semantically similar to previous content
 * Returns similarity analysis with reasoning
 */
export const checkContentSimilarity = async (
  newCoreSubject: string,
  previousSubjects: string[],
  threshold: number = 0.7
): Promise<ContentSimilarityCheck> => {
  const ai = getAIInstance();

  // If no history, it's automatically unique
  if (previousSubjects.length === 0) {
    return {
      isSimilar: false,
      similarityScore: 0,
      matchedSubjects: [],
      reasoning: 'No previous content to compare against'
    };
  }

  // Only check against recent subjects (last 50) for performance
  const recentSubjects = previousSubjects.slice(-50);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze if this NEW content idea is TOO SIMILAR to any PREVIOUS content.

NEW CONTENT:
"${newCoreSubject}"

PREVIOUS CONTENT (last 50):
${recentSubjects.map((s, i) => `${i + 1}. ${s}`).join('\n')}

SIMILARITY CRITERIA:
- Consider SEMANTIC meaning, not just word matching
- Focus on the CORE SUBJECT and unique angle
- Different visual angles of the SAME subject = SIMILAR (reject)
- Same general topic but DIFFERENT specific subject = NOT SIMILAR (accept)

Examples:
- "Bioluminescent jellyfish electricity" vs "Deep sea jellyfish bioluminescence" = SIMILAR (both about jellyfish light)
- "Ocean jellyfish bioluminescence" vs "Firefly bioluminescence mechanism" = NOT SIMILAR (different organisms)
- "Pyramid water channels thermal imaging" vs "Pyramid hidden chambers acoustic scan" = SIMILAR (same pyramid, different tech)
- "Egyptian pyramid chambers" vs "Mayan pyramid astronomy alignment" = NOT SIMILAR (different civilizations)

Return JSON:
{
  "isSimilar": true/false,
  "similarityScore": 0.0-1.0 (0=completely different, 1=identical),
  "matchedSubjects": ["most similar previous subject if any"],
  "reasoning": "Brief explanation of the decision"
}

Threshold: ${threshold} (similarity >= ${threshold} means REJECT)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSimilar: { type: Type.BOOLEAN },
            similarityScore: { type: Type.NUMBER },
            matchedSubjects: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING }
          },
          required: ["isSimilar", "similarityScore", "matchedSubjects", "reasoning"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    console.log(`🔍 Similarity check: ${result.isSimilar ? '❌ TOO SIMILAR' : '✅ UNIQUE'} (score: ${result.similarityScore})`);
    console.log(`   Reasoning: ${result.reasoning}`);

    return result;
  } catch (error) {
    console.error('Failed to check content similarity:', error);
    // On error, be conservative and allow the content
    return {
      isSimilar: false,
      similarityScore: 0,
      matchedSubjects: [],
      reasoning: 'Similarity check failed, allowing content'
    };
  }
};
