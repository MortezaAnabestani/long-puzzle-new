/**
 * 🔥 COMPLETE: Narrative Engine with AI Topic + Puzzle Variety
 * Location: src/services/ai/narrativeEngine.ts
 *
 * این فایل کامل است و جایگزین narrativeEngine.ts فعلی می‌شود
 */

import { GoogleGenAI, Type } from "@google/genai";
import {
  ReconstructionGenre,
  NarrativeLens,
  MasterVisualStyle,
  MusicMood,
  StoryArc,
  GENRE_PRESETS,
  ChapterRole,
  assignChapterRoles,
} from "../../types";
import { NarrativeGenerationResponse, NarrativeChapter } from "../types/serviceTypes";
import { generateEngagingTopic } from "./topicGenerator";
import { generateAllChapterPuzzles } from "./puzzleVariety";

const getAI = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// ─── STYLE PROMPTS ────────────────────────────────────────────────────

const STYLE_PROMPTS: Record<MasterVisualStyle, string> = {
  [MasterVisualStyle.CINEMATIC]:
    "Cinematic dark realism, dramatic chiaroscuro lighting, deep shadows, moody atmosphere, film noir influence, high contrast color grading",
  [MasterVisualStyle.DARK_DOCUMENTARY]:
    "Dark documentary noir, desaturated color palette, gritty texture, cold blue and amber tones, investigative atmosphere, raw and authentic feel",
  [MasterVisualStyle.VINTAGE]:
    "Vintage aged photograph aesthetic, sepia and faded tones, film grain texture, worn paper edges, nostalgic warmth, old-world charm",
  [MasterVisualStyle.EPIC_PAINTERLY]:
    "Epic painterly drama, Renaissance oil painting style, grand dramatic lighting, rich saturated colors, heroic composition, classical art influence",
  [MasterVisualStyle.FORENSIC]:
    "Forensic cold clinical aesthetic, sterile lighting, blue-white color palette, sharp precise details, analytical composition, evidence-room atmosphere",
  [MasterVisualStyle.ARCHAEOLOGICAL]:
    "Archaeological dusty discovery aesthetic, warm earth tones, ancient texture, weathered stone and sand, excavation atmosphere, golden discovery lighting",
};

const GENRE_CONTEXT: Record<ReconstructionGenre, string> = {
  [ReconstructionGenre.HISTORICAL_RECONSTRUCTION]:
    "Historical period accuracy, authentic cultural details, era-appropriate visual elements",
  [ReconstructionGenre.CRIMINAL_CASEFILE]:
    "Crime scene atmosphere, evidence-based visual details, tension and suspense in composition",
  [ReconstructionGenre.LOST_CIVILIZATIONS]:
    "Ancient civilization aesthetics, mysterious architecture, forgotten world atmosphere",
  [ReconstructionGenre.UNSOLVED_MYSTERIES]:
    "Enigmatic atmosphere, shadowy unknowns, questions embedded in visual composition",
};

const buildMasterStylePrompt = (style: MasterVisualStyle, genre: ReconstructionGenre): string =>
  `Visual Style: ${STYLE_PROMPTS[style]}. Genre Context: ${GENRE_CONTEXT[genre]}. 9:16 vertical composition. 4K cinematic quality.`;

// ─── MUSIC MOOD DETECTION ─────────────────────────────────────────────

export const detectMusicMoodFromTopic = (topic: string, narrativeLens: NarrativeLens): MusicMood => {
  const t = topic.toLowerCase();

  if (t.includes("mystery") || t.includes("secret") || t.includes("hidden")) return MusicMood.MYSTERIOUS;
  if (t.includes("dark") || t.includes("nightmare") || t.includes("horror")) return MusicMood.DARK;
  if (t.includes("epic") || t.includes("battle") || t.includes("war")) return MusicMood.EPIC;
  if (t.includes("calm") || t.includes("peace") || t.includes("meditation")) return MusicMood.CALM;
  if (t.includes("suspense") || t.includes("thriller") || t.includes("tension")) return MusicMood.SUSPENSE;
  if (t.includes("inspiring") || t.includes("motivat") || t.includes("uplift")) return MusicMood.INSPIRING;
  if (t.includes("adventure") || t.includes("explor") || t.includes("journey")) return MusicMood.ADVENTURE;
  if (t.includes("emotion") || t.includes("touching") || t.includes("heartfelt")) return MusicMood.EMOTIONAL;
  if (t.includes("nostalg") || t.includes("memory") || t.includes("vintage")) return MusicMood.NOSTALGIC;
  if (t.includes("science") || t.includes("technology") || t.includes("research"))
    return MusicMood.SCIENTIFIC;

  switch (narrativeLens) {
    case NarrativeLens.HIDDEN_DISCOVERY:
    case NarrativeLens.UNSOLVED_ENIGMA:
      return MusicMood.MYSTERIOUS;
    case NarrativeLens.WHY_MYSTERY:
      return MusicMood.SUSPENSE;
    case NarrativeLens.TRANSFORMATION:
      return MusicMood.INSPIRING;
    case NarrativeLens.ORIGIN_STORY:
      return MusicMood.NOSTALGIC;
    default:
      return MusicMood.MYSTERIOUS;
  }
};

// ─── STORY ARC ────────────────────────────────────────────────────────

export const generateCoherentStoryArc = async (
  topic: string,
  narrativeLens: NarrativeLens
): Promise<StoryArc> => {
  const ai = getAI();

  const lensInstructions: Record<NarrativeLens, string> = {
    [NarrativeLens.HIDDEN_DISCOVERY]:
      "Structure as a hidden mystery being revealed. Hook with what is hidden, build with clues, climax with the discovery, reveal the truth, conclude with impact.",
    [NarrativeLens.WHY_MYSTERY]:
      "Structure as a why question. Hook with puzzling phenomenon, build with evidence, climax with the mechanism, reveal the reason, conclude with significance.",
    [NarrativeLens.UNSOLVED_ENIGMA]:
      "Structure as an unsolved mystery. Hook with the enigma, build with theories, climax with the closest answer, reveal remaining mystery, conclude with lasting question.",
    [NarrativeLens.TRANSFORMATION]:
      "Structure as a transformation. Hook with the before state, build with the process, climax with the change moment, reveal the after state, conclude with legacy.",
    [NarrativeLens.ORIGIN_STORY]:
      "Structure as an origin tale. Hook with the current state, build with history, climax with the creation moment, reveal the legacy, conclude with present-day relevance.",
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Create a cohesive story arc for a documentary puzzle video about: "${topic}"
      Narrative Style: ${narrativeLens}
      ${lensInstructions[narrativeLens]}
      REQUIREMENTS: All parts tell ONE continuous story. Each segment under 70 characters. buildup has 3 progressive facts.
      Return JSON: { "hook": "...", "buildup": ["...","...","..."], "climax": "...", "reveal": "...", "conclusion": "..." }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING },
            buildup: { type: Type.ARRAY, items: { type: Type.STRING } },
            climax: { type: Type.STRING },
            reveal: { type: Type.STRING },
            conclusion: { type: Type.STRING },
          },
          required: ["hook", "buildup", "climax", "reveal", "conclusion"],
        },
      },
    });
    return JSON.parse(response.text || "{}") as StoryArc;
  } catch (e) {
    console.error("StoryArc generation failed:", e);
    return {
      hook: "What secret lies hidden here?",
      buildup: ["Every piece holds a clue", "The pattern emerges slowly", "Almost there..."],
      climax: "The truth is revealed",
      reveal: "Now you know the secret",
      conclusion: "The mystery lives on...",
    };
  }
};

// ─── SENTENCE VALIDATION ──────────────────────────────────────────────

const validateSentenceCompleteness = (text: string): boolean => {
  const trimmed = text.trim();
  if (!/[.!?]$/.test(trimmed)) return false;

  const lastSentence =
    trimmed
      .split(/[.!?]/)
      .filter((s) => s.trim())
      .pop() || "";
  const words = lastSentence.trim().split(/\s+/);
  const lastWord = words[words.length - 1]?.toLowerCase() || "";

  const incompleteMarkers = [
    "of",
    "and",
    "the",
    "but",
    "however",
    "with",
    "for",
    "in",
    "on",
    "at",
    "to",
    "a",
    "an",
    "or",
    "as",
    "if",
    "when",
    "while",
    "because",
    "although",
    "though",
    "since",
    "until",
    "before",
    "after",
    "during",
    "within",
    "without",
    "between",
    "among",
    "through",
    "by",
  ];

  return !incompleteMarkers.includes(lastWord);
};

const ensureCompleteNarrative = (text: string): string => {
  if (validateSentenceCompleteness(text)) return text;

  const sentences = text.split(/([.!?])\s+/).filter((s) => s.trim());
  const complete: string[] = [];

  for (let i = 0; i < sentences.length - 1; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || "");
    if (validateSentenceCompleteness(sentence)) {
      complete.push(sentence);
    }
  }

  return complete.join(" ").trim();
};

// ─── MAIN GENERATION ──────────────────────────────────────────────────

const LENS_INSTRUCTIONS: Record<NarrativeLens, string> = {
  [NarrativeLens.HIDDEN_DISCOVERY]:
    "Structure as a hidden mystery being gradually revealed chapter by chapter. Each chapter peels back one layer.",
  [NarrativeLens.WHY_MYSTERY]:
    "Structure as a deepening why question. Each chapter adds a new piece of evidence toward the answer.",
  [NarrativeLens.UNSOLVED_ENIGMA]:
    "Structure as an unsolved mystery. Build theories, present evidence, but leave the final answer tantalizingly incomplete.",
  [NarrativeLens.ORIGIN_STORY]:
    "Structure as an origin tale unfolding chronologically. Each chapter moves forward in time toward the present.",
  [NarrativeLens.TRANSFORMATION]:
    "Structure as a transformation journey. Each chapter shows one stage of the change from beginning to end.",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  HOOK: "This is the OPENING chapter. Ask a provocative question or show something shocking. Short and punchy.",
  RISING_ACTION:
    "This is a MIDDLE chapter. Build progressively. Add new facts or a surprising detail. End with a cliffhanger.",
  CLIMAX: "This is the CLIMAX. The most intense, dramatic, or surprising moment. Maximum emotional impact.",
  REVEAL: "This is the REVEAL. Answer the central question. The aha moment.",
  CONCLUSION:
    "This is the FINAL chapter. Wrap everything up. Leave a lasting impression or a thought-provoking question.",
};

/**
 * 🔥 COMPLETE: با AI topic generation + Puzzle variety
 */
export const generateDocumentaryNarrative = async (
  genre: ReconstructionGenre,
  topic: string,
  narrativeLens: NarrativeLens,
  targetDurationMinutes: number,
  masterVisualStyle: MasterVisualStyle
): Promise<NarrativeGenerationResponse> => {
  const ai = getAI();
  const preset = GENRE_PRESETS[genre];

  // 🔥 AI TOPIC GENERATION
  let finalTopic = topic.trim();
  if (finalTopic.length === 0) {
    console.log("🎯 No topic provided, generating AI topic...");
    const topicData = await generateEngagingTopic(genre, narrativeLens);
    finalTopic = topicData.topic;
    console.log(`✅ AI Generated Topic: ${finalTopic} (Score: ${topicData.engagementScore}/10)`);
  }

  const chapterCount = Math.floor((targetDurationMinutes * 60 - 60) / 45);
  const masterStylePrompt = buildMasterStylePrompt(masterVisualStyle, genre);

  const roleArray = assignChapterRoles(chapterCount);
  const roleStrings = roleArray.map((r) => r.toString());

  // 🔥 PUZZLE VARIETY GENERATION
  console.log("🎨 Generating puzzle variety for chapters...");
  const puzzleConfigs = generateAllChapterPuzzles(roleArray as ChapterRole[], chapterCount);

  const chapterInstructions = roleStrings
    .map((role, i) => `  Chapter ${i + 1} (${role}): ${ROLE_DESCRIPTIONS[role]}`)
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `You are creating a ${chapterCount}-chapter documentary puzzle video about: "${finalTopic}"

Genre: ${genre}
Narrative Style: ${narrativeLens}
${LENS_INSTRUCTIONS[narrativeLens]}

CHAPTER STRUCTURE (${chapterCount} chapters, each ~45 seconds):
${chapterInstructions}

🔥 CRITICAL REQUIREMENTS FOR narrativeText:
- MUST be 25-30 words (target for YouTube short-form vertical video)
- MUST contain ONLY complete sentences (no sentences ending with: "of", "and", "the", "but", "however", "with", etc.)
- Each sentence MUST end with proper punctuation (. ! ?)
- If a sentence would be incomplete, finish it or remove it entirely
- Ideal structure: 2-3 complete sentences that flow naturally
- Display time: ~3-4 seconds per text box
- Must be self-contained and make sense on its own

OTHER REQUIREMENTS:
- All ${chapterCount} chapters tell ONE continuous, coherent story
- Each chapter flows naturally into the next
- title: 3-5 words, dramatic
- imagePrompt: ONE specific scene (no text in image), visually distinct per chapter
- cliffhanger: end of each chapter except last
- keyFact: one surprising, specific fact per chapter

Return ONLY valid JSON:
{
  "masterStylePrompt": "string",
  "storyArc": { "hook": "string", "buildup": ["string","string","string"], "climax": "string", "reveal": "string", "conclusion": "string" },
  "keyFacts": ["string","string","string"],
  "chapters": [
    { "index": 0, "title": "string", "narrativeText": "string (25-30 words, complete sentences only)", "imagePrompt": "string", "cliffhanger": "string", "keyFact": "string" }
  ]
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            masterStylePrompt: { type: Type.STRING },
            storyArc: {
              type: Type.OBJECT,
              properties: {
                hook: { type: Type.STRING },
                buildup: { type: Type.ARRAY, items: { type: Type.STRING } },
                climax: { type: Type.STRING },
                reveal: { type: Type.STRING },
                conclusion: { type: Type.STRING },
              },
              required: ["hook", "buildup", "climax", "reveal", "conclusion"],
            },
            keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  index: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  narrativeText: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  cliffhanger: { type: Type.STRING },
                  keyFact: { type: Type.STRING },
                },
                required: ["index", "title", "narrativeText", "imagePrompt", "cliffhanger", "keyFact"],
              },
            },
          },
          required: ["masterStylePrompt", "storyArc", "keyFacts", "chapters"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");

    // 🔥 POST-PROCESS: Complete narratives + Add puzzle variety
    const processedChapters = (data.chapters || []).map((ch: NarrativeChapter, i: number) => ({
      ...ch,
      narrativeText: ensureCompleteNarrative(ch.narrativeText),
      puzzleConfig: puzzleConfigs[i],
    }));

    return {
      genre,
      topic: finalTopic,
      masterStylePrompt: masterStylePrompt + " " + (data.masterStylePrompt || ""),
      storyArc: data.storyArc as StoryArc,
      chapters: processedChapters,
      keyFacts: data.keyFacts || [],
    };
  } catch (e) {
    console.error("❌ [narrativeEngine] generateDocumentaryNarrative failed:", e);

    const fallbackChapters: NarrativeChapter[] = roleStrings.map((_, i) => ({
      index: i,
      title: i === 0 ? "The Beginning" : i === roleStrings.length - 1 ? "The End" : `Chapter ${i + 1}`,
      narrativeText: `Chapter ${
        i + 1
      } explores the fascinating story of ${finalTopic}. Each piece reveals something new about this incredible journey.`,
      imagePrompt: `A dramatic scene related to ${finalTopic}, moment ${i + 1}`,
      cliffhanger: i < roleStrings.length - 1 ? "But there is more to this story..." : "",
      keyFact: `Key fact ${i + 1} about ${finalTopic}`,
      puzzleConfig: puzzleConfigs[i],
    }));

    return {
      genre,
      topic: finalTopic,
      masterStylePrompt,
      storyArc: {
        hook: `What is the secret behind ${finalTopic}?`,
        buildup: ["The mystery deepens...", "New evidence emerges...", "The pieces connect..."],
        climax: "The truth is about to be revealed.",
        reveal: "Now you know the full story.",
        conclusion: `The legacy of ${finalTopic} continues...`,
      },
      chapters: fallbackChapters,
      keyFacts: [`${finalTopic} is more complex than you think`],
    };
  }
};
