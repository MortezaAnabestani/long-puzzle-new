/**
 * Gemini AI Service Hub
 *
 * Central export point for all AI-powered services
 * Individual services are organized in the /ai directory
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ArtStyle, NarrativeLens, MusicMood, StoryArc, ContentTheme } from "../types";

// ==================== TYPE EXPORTS ====================
export type {
  ArtGenerationResponse,
  YouTubeMetadata,
  SmartMusicTrack,
  EnhancedContentPackage,
  ContentSimilarityCheck,
} from "./types/serviceTypes";

// ==================== MODULE RE-EXPORTS ====================

// Music Selection
export { findSmartMusicByMood, findSmartMusic, SONIC_LIBRARY } from "./ai/musicSelection";

// Story Arc & Visual Prompts
export { generateCoherentStoryArc } from "./ai/storyArc";

// Content Validation
export { extractCoreSubject, checkContentSimilarity } from "./ai/contentValidation";

// ==================== LOCAL FUNCTIONS ====================
// Functions that are too small or tightly coupled to extract

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generate coherent content package with all elements aligned
 */
export const generateCoherentContentPackage = async (category: string, categoryLabel: string) => {
  const narrativeLenses = Object.values(NarrativeLens);
  const selectedLens = narrativeLenses[Math.floor(Math.random() * narrativeLenses.length)];

  const musicMoods = Object.values(MusicMood);
  const selectedMood = musicMoods[Math.floor(Math.random() * musicMoods.length)];

  console.log(
    `Generating coherent package: ${categoryLabel} with ${selectedLens} lens and ${selectedMood} mood`,
  );

  const { generateCoherentStoryArc } = await import("./ai/storyArc");
  const { generateVisualPromptFromTopic } = await import("./ai/storyArc");

  const storyArc = await generateCoherentStoryArc(category, selectedLens);
  const visualPrompt = await generateVisualPromptFromTopic(category, selectedLens);
  const metadata = await generateEnhancedMetadata(category, storyArc, selectedLens, categoryLabel);

  const theme: ContentTheme = {
    category: categoryLabel,
    topic: category,
    visualElements: [],
    keyFacts: [storyArc.hook, ...storyArc.buildup, storyArc.climax, storyArc.reveal],
    narrativeLens: selectedLens,
    musicMood: selectedMood,
  };

  return {
    theme,
    storyArc,
    visualPrompt,
    metadata,
  };
};

/**
 * Generate enhanced YouTube metadata with CTR optimization
 */
export const generateEnhancedMetadata = async (
  topic: string,
  storyArc: StoryArc,
  narrativeLens: NarrativeLens,
  category: string,
) => {
  const ai = getAIInstance();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create strategic YouTube Shorts metadata for a puzzle reveal video.

      Topic: "${topic}"
      Category: ${category}
      Narrative Style: ${narrativeLens}
      Story Hook: ${storyArc.hook}
      Story Reveal: ${storyArc.reveal}

      TITLE STRATEGY (CRITICAL - YouTube Thumbnail Standard):
      - MUST be 100% English - NO Persian, Arabic, Emoji, or special characters
      - Maximum 50-60 characters (fit in thumbnail without overflow)
      - Must create curiosity gap (promise revelation without spoiling)
      - Use power words: Secret, Hidden, Why, Truth, Mystery, Revealed
      - Must match what the video actually delivers
      - Test: Can it fit in ONE line on mobile thumbnail?
      - Example patterns:
        * "The Secret Behind [X] Revealed"
        * "Why [X] Does [Y] - The Truth"
        * "Hidden Truth About [X]"
        * "[X] vs [Y]: The Shocking Reality"

      DESCRIPTION STRATEGY (Enhanced for SEO & Engagement):
      - Length: 400-600 words (YouTube rewards detailed, structured descriptions)
      - CRITICAL: Must include complete video scenario without spoilers
      
      Structure (MANDATORY ORDER):
      1. HOOK (3-4 sentences): 
         - Start with the main mystery/question
         - Create intrigue about what viewers will discover
         - Promise a journey without revealing the answer
      
      2. VIDEO SCENARIO (4-5 sentences):
         - Describe the puzzle reveal format: "Watch as a mysterious image slowly comes together, piece by piece..."
         - Explain the narrative structure: "Each piece reveals a new clue about [topic]..."
         - Mention the visual journey: "Through stunning visuals and carefully crafted storytelling..."
         - Build anticipation: "As the final pieces fall into place, the truth becomes clear..."
         - NO spoilers but paint a picture of the experience
      
      3. CHAPTER TIMELINE (CRITICAL - Boosts watch time):
         📍 TIMESTAMPS:
         0:00 - The Mystery Begins
         0:15 - First Clues Emerge
         0:30 - The Plot Thickens
         0:45 - Unexpected Revelations
         1:00 - Pieces Fall Into Place
         1:15 - The Big Reveal
         1:30 - Final Thoughts
         
         (Adjust chapter titles to match the actual story arc provided)
      
      4. ENGAGEMENT QUESTION (1-2 sentences):
         - Ask viewers what they think
         - Encourage comments: "What surprised you most? Let us know in the comments!"
      
      5. CALL TO ACTION (1-2 sentences):
         - "If this blew your mind, smash that like button!"
         - "Subscribe for more mind-bending reveals!"
      
      6. HASHTAGS (Last line):
         - 3-4 relevant hashtags separated by spaces
      
      SEO KEYWORDS INTEGRATION:
      - Naturally weave topic keywords throughout (minimum 5-7 instances)
      - Include related search terms people might use
      - Add synonyms and variations
      
      TONE:
      - Exciting but not over-the-top
      - Professional yet accessible
      - Create FOMO (fear of missing out) without being clickbaity

      TAGS STRATEGY:
      - Mix broad terms (3-4) with specific niche terms (4-5)
      - Include category-specific tags
      - Add trending format tags (shorts, viral, mystery)
      - Total 10 tags

      HASHTAGS (separate from tags):
      - 5 hashtags for YouTube Shorts algorithm
      - Mix popular (#Shorts) with niche specific

      Return JSON with all fields.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            ctr_strategy: { type: Type.STRING },
          },
          required: ["title", "description", "tags", "hashtags", "ctr_strategy"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Enhanced metadata generation failed:", e);
    return {
      title: "Mystery Revealed",
      description: "Discover the hidden truth.",
      tags: ["shorts", "mystery"],
      hashtags: ["#Shorts"],
      ctr_strategy: "Curiosity gap",
    };
  }
};

/**
 * @deprecated Use generateEnhancedMetadata instead
 */
export const generateYouTubeMetadata = async (subject: string, style: ArtStyle) => {
  console.warn("DEPRECATED: Use generateEnhancedMetadata instead");
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create viral YouTube Shorts metadata for a puzzle reveal video about: "${subject}".
      The style is ${style}. Include a clickbaity title, a description with a curiosity loop, and 10 relevant tags.
      Also provide a CTR strategy summary. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            ctr_strategy: { type: Type.STRING },
          },
          required: ["title", "description", "tags", "ctr_strategy"],
        },
      },
    });
    const data = JSON.parse(response.text || "{}");
    return { ...data, hashtags: data.hashtags || ["#Shorts"] };
  } catch {
    return {
      title: "New Discovery",
      description: "History revealed.",
      tags: ["shorts"],
      hashtags: ["#Shorts"],
      ctr_strategy: "Mystery",
    };
  }
};

/**
 * Fetch a random fact narrative
 */
export const fetchFactNarrative = async (): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
      "Tell me one high-impact, mysterious historical fact that would be amazing to reveal in a puzzle. Under 100 characters.",
  });
  return response.text?.trim() || "A legendary historical event.";
};

/**
 * Get trending topics - Breaking News & Viral Content
 * این تابع محدود به تاریخی یا علمی نیست و هر نوع محتوای ترند و جذاب را پوشش می‌دهد
 */
export const getTrendingTopics = async (): Promise<string[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `List 5 CURRENT trending topics from the last 48 hours that would make viral puzzle video content.

      CONTENT CATEGORIES (Mix and match):
      - Breaking News & Current Events (global headlines, major announcements)
      - Celebrity Updates (iconic moments, fashion, relationships, achievements)
      - Viral Social Media Trends (challenges, memes, cultural phenomena)
      - Sports Highlights (record-breaking moments, championships, rivalries)
      - Entertainment Buzz (movies, music releases, award shows, controversies)
      - Technology Breakthroughs (AI advancements, gadget launches, space missions)
      - Pop Culture Moments (fashion trends, beauty standards, lifestyle shifts)
      - Science & Discovery (when it's currently trending and newsworthy)
      - Historical Parallels (only if directly relevant to current events)

      CRITICAL REQUIREMENTS:
      1. Focus on CURRENT, TRENDING, and NEWSWORTHY topics
      2. Mix different categories for variety
      3. Each topic should be specific and attention-grabbing
      4. Avoid generic historical facts unless tied to breaking news
      5. Include both serious news and entertainment/lifestyle content
      6. Make each topic feel FRESH and TIMELY
      7. Think like a viral content creator, not a documentary filmmaker

      GOOD EXAMPLES:
      - "Taylor Swift's record-breaking Eras Tour announcement"
      - "OpenAI's latest GPT model shocking capabilities"
      - "Oscars 2024: The most unexpected winner moment"
      - "Viral TikTok trend: Everyone's doing the [X] challenge"
      - "Elon Musk's latest Tesla innovation revealed"

      BAD EXAMPLES (avoid these):
      - "Ancient Egyptian pyramids construction methods" (too old, not trending)
      - "The mystery of deep ocean creatures" (too generic, not newsworthy)
      - "How stars are formed in space" (educational but not breaking news)

      Return as JSON array of 5 trending topics.`,
      config: {
        tools: [{ googleSearch: {} }], // Enable real-time search
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { topics: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["topics"],
        },
      },
    });
    const data = JSON.parse(response.text || "{}");
    return (
      data.topics || [
        "Latest AI breakthrough making headlines",
        "Celebrity fashion moment going viral",
        "Breaking tech announcement everyone's talking about",
        "Trending social media challenge of the week",
        "Major sports record shattered today",
      ]
    );
  } catch {
    return [
      "Latest AI breakthrough making headlines",
      "Celebrity fashion moment going viral",
      "Breaking tech announcement everyone's talking about",
      "Trending social media challenge of the week",
      "Major sports record shattered today",
    ];
  }
};
