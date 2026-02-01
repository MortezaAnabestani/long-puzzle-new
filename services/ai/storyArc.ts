/**
 * Story Arc Generation AI Service
 *
 * Handles cohesive story arc creation for puzzle videos
 */

import { GoogleGenAI, Type } from "@google/genai";
import { NarrativeLens, StoryArc } from "../../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCoherentStoryArc = async (
  topic: string,
  narrativeLens: NarrativeLens
): Promise<StoryArc> => {
  const ai = getAIInstance();

  const lensInstructions = {
    [NarrativeLens.HIDDEN_DISCOVERY]:
      "Structure as a hidden mystery being revealed. Hook with what's hidden, build with clues, climax with the discovery moment, reveal the truth.",
    [NarrativeLens.WHY_MYSTERY]:
      "Structure as a 'why' question. Hook with puzzling behavior/phenomenon, build with evidence, climax with the mechanism, reveal the reason.",
    [NarrativeLens.COMPARISON]:
      "Structure as a before/after or X vs Y comparison. Hook with the contrast, build with differences, climax with the key distinction, reveal the winner/outcome.",
    [NarrativeLens.UNSOLVED_ENIGMA]:
      "Structure as an unsolved mystery. Hook with the enigma, build with theories, climax with the closest answer, reveal that it remains mysterious.",
    [NarrativeLens.TRANSFORMATION]:
      "Structure as a transformation journey. Hook with the before state, build with the process, climax with the change moment, reveal the after state.",
    [NarrativeLens.COUNTDOWN]:
      "Structure as a countdown (Top 3/5). Hook with category, build through items 3,2, climax with #1 reveal, final statement on the winner.",
    [NarrativeLens.ORIGIN_STORY]:
      "Structure as an origin tale. Hook with the current state, build with historical context, climax with the creation moment, reveal the legacy.",
  };

  // Add variety seeds to ensure unique story angles
  const varietySeeds = [
    "Focus on the human element and emotional impact",
    "Emphasize the scientific breakthrough and discovery process",
    "Highlight the historical significance and timeline",
    "Explore the technical mechanism and how it works",
    "Reveal the cultural impact and social change",
    "Uncover the hidden details and little-known facts",
    "Show the scale and magnitude in vivid terms",
    "Connect to modern relevance and current implications",
    "Highlight the celebrity's iconic moment and influence",
    "Reveal the behind-the-scenes story and drama",
    "Show the viral phenomenon and why it spread",
    "Explore the breaking news angle and immediate impact",
    "Focus on the fashion/style evolution and trendsetting",
    "Uncover the controversy and public reaction",
  ];
  const selectedSeed = varietySeeds[Math.floor(Math.random() * varietySeeds.length)];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Create a COHESIVE story arc for a puzzle reveal video about: "${topic}"

      Narrative Style: ${narrativeLens}
      ${lensInstructions[narrativeLens]}
      Story Angle: ${selectedSeed}

      CONTENT TYPE GUIDELINES:
      - For Celebrity/Entertainment: Focus on iconic moments, influence, style evolution
      - For Breaking News: Emphasize immediacy, impact, why it matters now
      - For Science/History: Use verifiable facts and discovery narratives
      - For Viral Trends: Explain the phenomenon, cultural impact, why it spread
      - For Fashion/Beauty: Highlight aesthetic choices, trendsetting, visual impact

      CRITICAL REQUIREMENTS:
      1. All 5 parts must tell ONE continuous story about the SAME subject
      2. Each snippet must flow naturally to the next
      3. Use ACCURATE INFORMATION (for celebrities/news, cite recent events)
      4. Each text segment under 70 characters
      5. The climax must align with puzzle completion (90% mark)
      6. The reveal must be the satisfying answer/conclusion
      7. Make this story arc UNIQUE by exploring the specific angle mentioned above
      8. Avoid generic statements - use specific details and examples
      9. For breaking news/celebrity content, capture the excitement and immediacy

      Return JSON with:
      {
        "hook": "Opening question or mystery setup",
        "buildup": ["fact 1", "fact 2", "fact 3"] (progressive reveal),
        "climax": "The peak moment/question resolution",
        "reveal": "Final answer/truth revealed"
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING },
            buildup: { type: Type.ARRAY, items: { type: Type.STRING } },
            climax: { type: Type.STRING },
            reveal: { type: Type.STRING },
          },
          required: ["hook", "buildup", "climax", "reveal"],
        },
      },
    });
    const data = JSON.parse(response.text || "{}");
    return data as StoryArc;
  } catch (e) {
    console.error("StoryArc generation failed:", e);
    return {
      hook: "What secret lies hidden here?",
      buildup: ["Every piece holds a clue", "The pattern emerges slowly", "Almost there..."],
      climax: "The truth is revealed",
      reveal: "Now you know the secret",
    };
  }
};

export const generateVisualPromptFromTopic = async (
  topic: string,
  narrativeLens: NarrativeLens
): Promise<string> => {
  const ai = getAIInstance();

  const visualGuidance = {
    [NarrativeLens.HIDDEN_DISCOVERY]:
      "Focus on mysterious, partially hidden elements, dramatic reveal lighting, archaeological discovery aesthetics",
    [NarrativeLens.WHY_MYSTERY]:
      "Show the puzzling phenomenon in action, scientific observation style, question-provoking composition",
    [NarrativeLens.COMPARISON]:
      "Split composition or before/after layout, clear visual contrast, side-by-side comparison aesthetics",
    [NarrativeLens.UNSOLVED_ENIGMA]:
      "Enigmatic atmosphere, unanswered questions visual metaphor, mysterious shadows and fog",
    [NarrativeLens.TRANSFORMATION]:
      "Show transformation in progress, metamorphosis visual, dynamic change capture",
    [NarrativeLens.COUNTDOWN]:
      "Hero shot of the #1 item, trophy presentation style, winner spotlight aesthetics",
    [NarrativeLens.ORIGIN_STORY]: "Historical recreation, origin moment capture, genesis visual narrative",
  };

  // Add uniqueness factors to prevent repetitive AI responses
  const uniquenessFactors = [
    "Focus on a rarely-seen aspect or angle",
    "Highlight an unexpected detail that most people miss",
    "Show from a unique perspective not commonly depicted",
    "Emphasize a specific moment in time or process",
    "Reveal an uncommon variation or example",
  ];
  const selectedUniqueness = uniquenessFactors[Math.floor(Math.random() * uniquenessFactors.length)];

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Convert this topic into a SPECIFIC, DETAILED cinematic visual prompt for an image generator: "${topic}"

    Narrative Context: ${narrativeLens}
    Visual Style Guide: ${visualGuidance[narrativeLens]}
    Uniqueness Direction: ${selectedUniqueness}

    CONTENT-SPECIFIC VISUAL GUIDELINES:
    - For Celebrity/Fashion: Magazine cover quality, dramatic lighting, red carpet glamour, iconic pose
    - For Breaking News: Photojournalistic style, capturing the moment, news-worthy composition
    - For Viral Trends: Social media aesthetic, modern, shareable visual, trendy composition
    - For Science/History: Documentary quality, educational clarity, authentic detail
    - For Beauty/Elegance: Sophisticated lighting, refined aesthetics, artistic composition

    General Requirements:
    - Specify exact subject, setting, lighting, atmosphere
    - Include 3-5 specific visual elements that must appear
    - Mention color palette and mood
    - Optimize for 9:16 vertical composition
    - Make it cinematic and high-quality
    - Ensure the visual directly supports the story being told
    - Make this interpretation UNIQUE and SPECIFIC (avoid generic descriptions)
    - Each generation should explore a different facet of the topic
    - For people/celebrities: Describe pose, expression, styling details

    Return ONLY the detailed prompt, no explanations.`,
  });
  return response.text?.trim() || topic;
};

/**
 * @deprecated Use generateCoherentStoryArc instead
 */
export const generateDocumentarySnippets = async (topic: string): Promise<string[]> => {
  console.warn("DEPRECATED: Use generateCoherentStoryArc instead");
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Provide 5 mind-blowing short facts for "${topic}". Each fact must be under 80 characters. Return as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { snippets: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["snippets"],
        },
      },
    });
    const data = JSON.parse(response.text || "{}");
    return data.snippets || ["Did you know this was hidden?", "The secret is in the details."];
  } catch {
    return ["Unknown History", "Fact of the day"];
  }
};
