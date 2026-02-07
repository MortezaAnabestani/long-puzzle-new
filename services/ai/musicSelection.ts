/**
 * Music Selection AI Service
 *
 * Handles smart music track selection based on mood and topic
 */

import { GoogleGenAI, Type } from "@google/genai";
import { MusicMood } from "../../types";
import { SmartMusicTrack } from "../types/serviceTypes";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const SONIC_LIBRARY = [
  {
    id: "sc-1",
    title: "Deep Ambient Mystery",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    genre: "Documentary",
  },
  {
    id: "sc-2",
    title: "Cinematic History",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    genre: "Cinematic",
  },
  {
    id: "sc-3",
    title: "Techno Discovery",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    genre: "Electronic",
  },
  {
    id: "sc-4",
    title: "Ancient Echoes",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    genre: "Ambient",
  },
];

/**
 * 🆕 Maps MusicMood to backend database folder names
 */
export const MOOD_TO_FOLDER_MAP: Record<MusicMood, string> = {
  [MusicMood.CALM]: "calm",
  [MusicMood.DARK]: "dark",
  [MusicMood.EPIC]: "epic",
  [MusicMood.INSPIRING]: "inspiring",
  [MusicMood.MYSTERIOUS]: "mysterious",
  [MusicMood.SUSPENSE]: "suspense",
  [MusicMood.UPLIFTING]: "uplifting",
  [MusicMood.EMOTIONAL]: "emotional",
  [MusicMood.SCIENTIFIC]: "scientific",
  [MusicMood.ADVENTURE]: "adventure",
  [MusicMood.NOSTALGIC]: "nostalgic",
  [MusicMood.NEUTRAL]: "neutral",
};

/**
 * 🆕 Get database folder name from MusicMood
 */
export const getFolderFromMood = (mood: MusicMood): string => {
  return MOOD_TO_FOLDER_MAP[mood] || "calm";
};

export const findSmartMusicByMood = async (
  musicMood: MusicMood,
  topic: string
): Promise<SmartMusicTrack | null> => {
  const ai = getAIInstance();

  const moodGuidance = {
    [MusicMood.MYSTERIOUS]:
      "Gentle mysterious ambience with soft pads, light tension, relaxing tempo (60-80 BPM), soothing but intriguing, good for puzzle solving and focus",
    [MusicMood.EPIC]:
      "Uplifting cinematic music, inspiring orchestral, positive energy, medium tempo (85-100 BPM), motivating but not overwhelming, suitable for achievements",
    [MusicMood.CALM]:
      "Very peaceful and relaxing, gentle piano or ambient pads, soft nature sounds, slow comfortable tempo (50-70 BPM), meditation-like, perfect for concentration",
    [MusicMood.SUSPENSE]:
      "Light suspenseful background, subtle tension without being heavy, flowing rhythm (70-85 BPM), creates curiosity not anxiety, engaging for puzzle discovery",
    [MusicMood.INSPIRING]:
      "Warm uplifting melody, hopeful and positive, gentle progression, comfortable tempo (75-95 BPM), encourages focus and accomplishment, bright but relaxing",
    [MusicMood.DARK]:
      "Deep atmospheric ambience, rich bass but not aggressive, slow hypnotic tempo (55-75 BPM), mysterious depth without heaviness, contemplative mood",
    [MusicMood.UPLIFTING]:
      "Hopeful and bright melodies, positive energy without being intense, comfortable tempo (80-100 BPM), encouraging and motivational, warm atmosphere",
    [MusicMood.EMOTIONAL]:
      "Touching and heartfelt, gentle emotional progression, slow to medium tempo (60-80 BPM), human connection feel, reflective and warm",
    [MusicMood.SCIENTIFIC]:
      "Clean modern ambient, intelligent sound design, steady rhythm (70-90 BPM), documentary quality, focus-enhancing without distraction",
    [MusicMood.ADVENTURE]:
      "Exploratory and curious, sense of discovery, medium tempo (75-95 BPM), exciting but not overwhelming, journey-like progression",
    [MusicMood.NOSTALGIC]:
      "Warm vintage feel, memory-evoking melodies, slow comfortable tempo (55-75 BPM), sentimental without being sad, reflective atmosphere",
    [MusicMood.NEUTRAL]:
      "Balanced background ambience, non-intrusive, medium tempo (65-85 BPM), suitable for any topic, professional and clean",
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find a 100% ROYALTY-FREE (YouTube Safe) direct MP3 download link for PUZZLE-SOLVING background music.

      CORE CONTEXT: This music is for a PUZZLE VIDEO where pieces come together calmly and satisfyingly.
      The base mood should be RELAXING, FOCUSED, and PLEASANT regardless of topic.

      Topic Theme: "${topic}"
      Mood Direction: ${musicMood}
      Musical Style Guide: ${moodGuidance[musicMood]}

      CRITICAL REQUIREMENTS:
      1. PRIMARY: Music MUST be relaxing and suitable for puzzle-solving concentration
      2. SECONDARY: Subtle hints of the mood/topic theme without being heavy or dramatic
      3. Tempo: Medium-slow (50-100 BPM) - NEVER too fast or aggressive
      4. Energy: Calm to moderate - NEVER intense, heavy, or overwhelming
      5. Vibe: Background music that helps focus, not demands attention
      6. SOURCES: ONLY direct .mp3 links from pixabay.com/music or incompetech.com
      7. NO YouTube links, NO streaming services
      8. Instrumental only (no vocals)
      9. Length: At least 1-2 minutes

      AVOID:
      - Heavy, dark, or overly dramatic tracks
      - Fast tempos or aggressive beats
      - Loud, attention-demanding music
      - Anything that would distract from puzzle solving

      IDEAL EXAMPLES:
      - Soft ambient with gentle movement
      - Light piano with atmospheric pads
      - Calm electronic with smooth progression
      - Peaceful orchestral backgrounds

      Return JSON ONLY:
      { "title": "Track Title", "url": "https://...direct-link.mp3", "source": "Pixabay/Incompetech" }`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            source: { type: Type.STRING },
          },
          required: ["title", "url", "source"],
        },
      },
    });

    const track = JSON.parse(response.text || "null");
    if (track && track.url && (track.url.includes("pixabay") || track.url.includes("incompetech"))) {
      return track;
    }
    return null;
  } catch (e) {
    console.error("Smart music search failed:", e);
    return null;
  }
};

/**
 * @deprecated Use findSmartMusicByMood instead
 */
export const findSmartMusic = async (topic: string): Promise<SmartMusicTrack | null> => {
  console.warn("DEPRECATED: Use findSmartMusicByMood instead");
  return findSmartMusicByMood(MusicMood.MYSTERIOUS, topic);
};
