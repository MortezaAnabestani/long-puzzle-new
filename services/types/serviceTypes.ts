/**
 * Shared type definitions for AI services
 */

import { ArtStyle, NarrativeLens, MusicMood, StoryArc, ContentTheme } from "../../types";

export interface ArtGenerationResponse {
  imageUrl: string;
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  ctr_strategy: string;
}

export interface SmartMusicTrack {
  title: string;
  url: string;
  source: string;
}

export interface EnhancedContentPackage {
  theme: ContentTheme;
  storyArc: StoryArc;
  visualPrompt: string;
  metadata: YouTubeMetadata;
}

export interface ContentSimilarityCheck {
  isSimilar: boolean;
  similarityScore: number;
  matchedSubjects: string[];
  reasoning: string;
}

// Re-export types that services need
export type { ArtStyle, NarrativeLens, MusicMood, StoryArc, ContentTheme };
