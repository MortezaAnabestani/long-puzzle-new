/**
 * Documentary Puzzle Studio — serviceTypes.ts
 * سرویس تایپ‌ها: فقط long-form. هیچ short-form remnant نیست.
 */

import {
  Chapter,
  MusicTimeline,
  ReconstructionGenre,
  DocumentaryProject,
  StoryArc,
  MusicMood,
  NarrativeLens,
  MasterVisualStyle,
} from "../../types";

// ─── NARRATIVE GENERATION ─────────────────────────────────────────────

/** یک فصل خام — خروجی AI قبل از image gen */
export interface NarrativeChapter {
  index: number;
  title: string;
  narrativeText: string; // ۲-۳ جمله روایت این فصل
  imagePrompt: string; // پرامپت تصویر (شامل master style)
  cliffhanger: string; // آخر فصل — "اما..." — کنجکاوی ایجاد کنه
  keyFact: string; // فکت اصلی این فصل
}

/** خروجی کامل narrative generation */
export interface NarrativeGenerationResponse {
  genre: ReconstructionGenre;
  topic: string;
  masterStylePrompt: string;
  storyArc: StoryArc;
  chapters: NarrativeChapter[];
  keyFacts: string[];
}

// ─── BATCH IMAGE GENERATION ───────────────────────────────────────────

export interface BatchImageResult {
  chapterId: string;
  chapterIndex: number;
  imageUrl: string;
  status: "success" | "failed";
  error?: string;
}

export interface BatchImageGenerationResponse {
  results: BatchImageResult[];
  totalGenerated: number;
  totalFailed: number;
}

/** progress event — حین batch image gen صدا میشه */
export interface BatchProgressEvent {
  type: "chapter_started" | "chapter_completed" | "chapter_failed" | "all_completed";
  chapterIndex: number;
  totalChapters: number;
  completedCount: number;
  imageUrl?: string;
}

// ─── MUSIC DISCOVERY ──────────────────────────────────────────────────

export interface SmartMusicTrack {
  title: string;
  url: string;
  source: string;
}

export interface LongFormMusicDiscoveryRequest {
  genre: ReconstructionGenre;
  topic: string;
  moods: {
    ambient: MusicMood;
    climax: MusicMood;
    reveal: MusicMood;
  };
  durationMinutes: number;
}

export interface LongFormMusicDiscoveryResponse {
  ambientTrack: SmartMusicTrack | null;
  climaxTrack: SmartMusicTrack | null;
  revealTrack: SmartMusicTrack | null;
}

// ─── YOUTUBE / SEO ────────────────────────────────────────────────────

export interface ChapterMarker {
  timestamp: string; // "0:00", "0:45", "1:30"
  title: string;
}

/** metadata کامل — شامل chapter markers برای YouTube */
export interface DocumentaryMetadata {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  ctr_strategy: string;
  chapterMarkers: ChapterMarker[];
}

// ─── FULL CONTENT PACKAGE ─────────────────────────────────────────────

/** پیکج کامل یک پروژه */
export interface DocumentaryContentPackage {
  project: DocumentaryProject;
  storyArc: StoryArc;
  chapters: Chapter[];
  musicTimeline: MusicTimeline;
  metadata: DocumentaryMetadata;
}

// ─── SIMILARITY CHECK ─────────────────────────────────────────────────

export interface ContentSimilarityCheck {
  isSimilar: boolean;
  similarityScore: number;
  matchedSubjects: string[];
  reasoning: string;
}

// ─── Re-exports ───────────────────────────────────────────────────────

export type {
  Chapter,
  MusicTimeline,
  ReconstructionGenre,
  DocumentaryProject,
  StoryArc,
  MusicMood,
  NarrativeLens,
  MasterVisualStyle,
};
