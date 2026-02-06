/**
 * 🔥 PHASE C: AI Topic Generator
 * Location: src/services/ai/topicGenerator.ts
 *
 * Automatically generates engaging, YouTube-optimized topics
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ReconstructionGenre, NarrativeLens } from "../../types";

const getAI = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// ─── GENRE TOPIC GUIDELINES ──────────────────────────────────────────

const GENRE_TOPIC_GUIDELINES: Record<ReconstructionGenre, string> = {
  [ReconstructionGenre.HISTORICAL_RECONSTRUCTION]: `
    Focus on: Major historical events, turning points in civilization, pivotal battles, significant discoveries
    Style: Epic, dramatic, with clear cause-and-effect narratives
    Examples: Fall of empires, world wars, revolutions, exploration of new continents
    Engagement: "What if X didn't happen?" or "The hidden truth behind Y"
    Trending: Ancient Rome, WWII, Renaissance, Age of Exploration
  `,
  [ReconstructionGenre.CRIMINAL_CASEFILE]: `
    Focus on: Unsolved mysteries, famous criminal cases, true crime stories
    Style: Suspenseful, evidence-based, investigative
    Examples: Serial killers, heists, disappearances, forensic breakthroughs
    Engagement: "Who really did it?" or "The clue everyone missed"
    Trending: Jack the Ripper, Zodiac, D.B. Cooper, Cold cases
  `,
  [ReconstructionGenre.LOST_CIVILIZATIONS]: `
    Focus on: Ancient civilizations, archaeological discoveries, forgotten cities
    Style: Mysterious, awe-inspiring, archaeological
    Examples: Atlantis, Pompeii, Maya, Easter Island, ancient wonders
    Engagement: "What happened to X?" or "The secret of Y revealed"
    Trending: Egyptian tombs, Mayan pyramids, Underwater cities, Ancient tech
  `,
  [ReconstructionGenre.UNSOLVED_MYSTERIES]: `
    Focus on: Unexplained phenomena, conspiracy theories (fact-based), enigmas
    Style: Intriguing, thought-provoking, open-ended
    Examples: Nazca Lines, Voynich Manuscript, Bermuda Triangle, Stonehenge
    Engagement: "Why did X happen?" or "The mystery scientists can't explain"
    Trending: UFO sightings, Ancient artifacts, Cryptids, Paranormal events
  `,
};

// ─── YOUTUBE ENGAGEMENT CRITERIA ──────────────────────────────────────

const YOUTUBE_ENGAGEMENT_RULES = `
YOUTUBE OPTIMIZATION CRITERIA:
- Topic must have mass appeal (broad audience interest)
- Clear clickbait potential without being misleading
- Based on real facts/history (no pure fiction)
- Visual storytelling potential (can be shown in images)
- Emotional hook (curiosity, shock, awe, fear)
- Searchable keywords (people actively search for this)
- Evergreen content (relevant beyond trending news)
- Shareable factor (people want to share with friends)

TARGET AUDIENCE:
- Age: 18-45
- Interests: History, science, mysteries, documentaries
- Platform: YouTube Shorts/TikTok/Instagram Reels (vertical video)
- Watch time: 8-15 minutes
- Language: English (international audience)

AVOID:
- Overly niche topics (too academic)
- Controversial/divisive topics (politics, religion)
- Depressing subjects (mass tragedies, suffering)
- Topics requiring extensive prior knowledge
`;

// ─── MAIN: GENERATE ENGAGING TOPIC ───────────────────────────────────

export interface GeneratedTopic {
  topic: string;
  rationale: string;
  engagementScore: number;
  keywords: string[];
  suggestedNarrativeLens: NarrativeLens;
}

export const generateEngagingTopic = async (
  genre: ReconstructionGenre,
  preferredLens?: NarrativeLens
): Promise<GeneratedTopic> => {
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `You are an expert YouTube content strategist specializing in documentary puzzle videos.

TASK: Generate ONE highly engaging topic for a ${genre} video.

GENRE GUIDELINES:
${GENRE_TOPIC_GUIDELINES[genre]}

${YOUTUBE_ENGAGEMENT_RULES}

${preferredLens ? `PREFERRED NARRATIVE LENS: ${preferredLens} (but can suggest alternative if better)` : ""}

REQUIREMENTS:
- Topic must be in ENGLISH (international audience)
- Clear, specific, and intriguing (not vague)
- Based on real history/science/facts
- High visual potential for puzzle images
- Strong emotional hook
- 3-10 words maximum
- Include engagement score (1-10, where 10 = viral potential)
- Explain why this topic will perform well
- Suggest best narrative lens for this topic
- Provide SEO keywords

Return ONLY valid JSON:
{
  "topic": "string (3-10 words, English)",
  "rationale": "string (why this will engage YouTube audience)",
  "engagementScore": number (1-10),
  "keywords": ["string", "string", "string"],
  "suggestedNarrativeLens": "HIDDEN_DISCOVERY" | "WHY_MYSTERY" | "UNSOLVED_ENIGMA" | "ORIGIN_STORY" | "TRANSFORMATION"
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            rationale: { type: Type.STRING },
            engagementScore: { type: Type.NUMBER },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedNarrativeLens: { type: Type.STRING },
          },
          required: ["topic", "rationale", "engagementScore", "keywords", "suggestedNarrativeLens"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");

    return {
      topic: data.topic || "The Mystery Continues",
      rationale: data.rationale || "Engaging historical content",
      engagementScore: Math.min(10, Math.max(1, data.engagementScore || 7)),
      keywords: data.keywords || [],
      suggestedNarrativeLens: data.suggestedNarrativeLens || preferredLens || NarrativeLens.HIDDEN_DISCOVERY,
    };
  } catch (e) {
    console.error("❌ [topicGenerator] Failed to generate topic:", e);

    const fallbackTopics: Record<ReconstructionGenre, string[]> = {
      [ReconstructionGenre.HISTORICAL_RECONSTRUCTION]: [
        "The Fall of the Roman Empire",
        "D-Day: The Untold Story",
        "Cleopatra's Lost Tomb",
      ],
      [ReconstructionGenre.CRIMINAL_CASEFILE]: [
        "Jack the Ripper: New Evidence",
        "The Zodiac Killer's Secret Code",
        "D.B. Cooper: Where Is He Now?",
      ],
      [ReconstructionGenre.LOST_CIVILIZATIONS]: [
        "Atlantis: Fact or Fiction?",
        "Pompeii's Last Day",
        "The Maya Collapse Mystery",
      ],
      [ReconstructionGenre.UNSOLVED_MYSTERIES]: [
        "The Nazca Lines Decoded",
        "Stonehenge's Hidden Purpose",
        "The Voynich Manuscript Secret",
      ],
    };

    const topics = fallbackTopics[genre];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    return {
      topic,
      rationale: "High-engagement historical mystery",
      engagementScore: 7,
      keywords: topic.toLowerCase().split(" "),
      suggestedNarrativeLens: preferredLens || NarrativeLens.HIDDEN_DISCOVERY,
    };
  }
};

export const generateTopicOptions = async (
  genre: ReconstructionGenre,
  count: number = 3
): Promise<GeneratedTopic[]> => {
  const topics: GeneratedTopic[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const topic = await generateEngagingTopic(genre);
      topics.push(topic);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.error(`Failed to generate topic ${i + 1}:`, e);
    }
  }

  return topics.sort((a, b) => b.engagementScore - a.engagementScore);
};
