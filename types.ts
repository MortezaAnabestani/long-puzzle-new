// ============================================================
// Documentary Puzzle Studio — types.ts
// فقط و فقط long-form (8+ دقیقه). هیچ short-form remnant نیست.
// ============================================================

// ─── PUZZLE VISUALS (فعلی، دست‌نخورده، هنوز استفاده میشن) ────────────

export enum ArtStyle {
  MANDALA = "Detailed Mandala",
  STAINED_GLASS = "Stained Glass Art",
  CYBERPUNK = "Cyberpunk Illustration",
  WATERCOLOR = "Professional Watercolor",
  ANIME = "High-End Anime Scene",
  OIL_PAINTING = "Classical Oil Painting",
  VECTOR_ART = "Clean Vector Art",
  HYPER_REALISTIC = "Hyper-Realistic Photo",
}

export enum PieceShape {
  SQUARE = "Square",
  TRIANGLE = "Triangle",
  HEXAGON = "Hexagon",
  DIAMOND = "Diamond",
  BRICK = "Brick/Rectangle",
  CHEVRON = "Chevron",
  JIGSAW = "True Interlocking",
}

export enum PieceMaterial {
  CARDBOARD = "Classic Cardboard",
  WOOD = "Polished Oak",
  GLASS = "Frosted Glass",
  CARBON = "Carbon Fiber",
}

export enum MovementType {
  STANDARD = "Realistic",
  FLIGHT = "Flight (Swoop)",
  WAVE = "Ocean Wave",
  PLAYFUL = "Bouncy Playful",
  VORTEX = "Spiral Vortex",
  ELASTIC = "Elastic Pop",
}

export enum PuzzleBackground {
  FROSTED_DISCOVERY = "Frosted Discovery",
}
export enum TopicType {
  BREAKING = "Breaking Signal",
  VIRAL = "Viral Trend",
  MANUAL = "Custom Entry",
  NARRATIVE = "Historical Discovery",
}

export enum MusicSelectionMode {
  AI_SEARCH = "AI_SEARCH", // Use AI to find music online
  DATABASE = "DATABASE", // Use local database music
}
// ─── LONG-FORM CORE ENUMS ─────────────────────────────────────────────

/** چهار ژنره بازسازی تاریخی */
export enum ReconstructionGenre {
  HISTORICAL_RECONSTRUCTION = "Historical Reconstruction",
  CRIMINAL_CASEFILE = "Criminal Casefile",
  LOST_CIVILIZATIONS = "Lost Civilizations",
  UNSOLVED_MYSTERIES = "Unsolved Mysteries",
}

/** نقش هر فصل در ساختار روایت */
export enum ChapterRole {
  HOOK = "HOOK",
  RISING_ACTION = "RISING_ACTION",
  CLIMAX = "CLIMAX",
  REVEAL = "REVEAL",
  CONCLUSION = "CONCLUSION",
}

/** انوع انتقال بین فصل‌ها */
export enum ChapterTransition {
  FADE_TEXT = "FADE_TEXT",
  PARTICLE_DISSOLVE = "PARTICLE_DISSOLVE",
  TIMELINE_PULSE = "TIMELINE_PULSE",
}

/** سبل بصری کل پروژه — یکی انتخاب میشه، به تمام فصل‌ها اضافه میشه */
export enum MasterVisualStyle {
  CINEMATIC = "Cinematic Dark Realism",
  DARK_DOCUMENTARY = "Dark Documentary Noir",
  VINTAGE = "Vintage Aged Photograph",
  EPIC_PAINTERLY = "Epic Painterly Drama",
  FORENSIC = "Forensic Cold Clinical",
  ARCHAEOLOGICAL = "Archaeological Dusty Discovery",
}

/** موضوع انتخاب: پیشنهاد AI یا دستی کاربر */
export enum TopicSource {
  AI_SUGGESTED = "AI_SUGGESTED",
  MANUAL = "MANUAL",
}

/** مود موسیقی */
export enum MusicMood {
  MYSTERIOUS = "Mysterious Ambient",
  EPIC = "Epic Cinematic",
  CALM = "Calm Atmospheric",
  SUSPENSE = "Suspenseful Tension",
  INSPIRING = "Inspiring Uplifting",
  DARK = "Dark Intense",
  EMOTIONAL = "Emotional Touching",
  SCIENTIFIC = "Scientific Documentary",
  ADVENTURE = "Adventure Exploration",
  NOSTALGIC = "Nostalgic Memory",
}

/** زاویه روایت */
export enum NarrativeLens {
  HIDDEN_DISCOVERY = "Hidden Discovery",
  WHY_MYSTERY = "Why Mystery",
  UNSOLVED_ENIGMA = "Unsolved Enigma",
  ORIGIN_STORY = "Origin Story",
  TRANSFORMATION = "Before/After Transformation",
}

// ─── CHAPTER ──────────────────────────────────────────────────────────

export enum ChapterStatus {
  PENDING = "PENDING",
  GENERATING_IMAGE = "GENERATING_IMAGE",
  IMAGE_READY = "IMAGE_READY",
  PLAYING = "PLAYING",
  COMPLETED = "COMPLETED",
}

export interface ChapterPuzzleConfig {
  pieceCount: number;
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  complexityLevel: "easy" | "medium" | "hard";
}

export interface Chapter {
  id: string;
  index: number;
  role: ChapterRole;
  title: string;
  narrativeText: string;
  imagePrompt: string;
  imageUrl: string | null;
  puzzleConfig: ChapterPuzzleConfig;
  durationSeconds: number;
  transition: ChapterTransition;
  status: ChapterStatus;
}

// ─── MUSIC TIMELINE ───────────────────────────────────────────────────

export interface ChapterStinger {
  chapterIndex: number;
  url: string;
  duration: number;
}

export interface MusicTimeline {
  ambientTrackUrl: string | null;
  climaxTrackUrl: string | null;
  revealTrackUrl: string | null;
  chapterStingers: ChapterStinger[];
}

// ─── PROJECT ──────────────────────────────────────────────────────────

export enum ProjectStatus {
  IDLE = "IDLE",
  GENERATING_NARRATIVE = "GENERATING_NARRATIVE",
  GENERATING_IMAGES = "GENERATING_IMAGES",
  FINDING_MUSIC = "FINDING_MUSIC",
  READY_TO_PLAY = "READY_TO_PLAY",
  PLAYING = "PLAYING",
  RECORDING = "RECORDING",
  COMPLETED = "COMPLETED",
}

export interface DocumentaryProject {
  id: string;
  genre: ReconstructionGenre;
  topic: string;
  narrativeLens: NarrativeLens;
  targetDurationMinutes: number;
  masterVisualStyle: MasterVisualStyle;
  masterStylePrompt: string;
  chapters: Chapter[];
  musicTimeline: MusicTimeline;
  status: ProjectStatus;
  createdAt: number;
}

export enum BackendMode {
  JSON = "json",
  ALL = "all",
}

// ─── STORY ARC ────────────────────────────────────────────────────────

export interface StoryArc {
  hook: string;
  buildup: string[];
  climax: string;
  reveal: string;
  conclusion: string;
}

// ─── USER PREFERENCES ─────────────────────────────────────────────────

export interface UserPreferences {
  genre: ReconstructionGenre;
  topic: string;
  topicSource: TopicSource;
  narrativeLens: NarrativeLens;
  masterVisualStyle: MasterVisualStyle;
  targetDurationMinutes: number; // 8 | 10 | 12 | 15
  defaultPieceCount: number;
  defaultShape: PieceShape;
  defaultMaterial: PieceMaterial;
  defaultMovement: MovementType;
  background: PuzzleBackground;
  showDocumentaryTips: boolean;
}

// ─── GENRE PRESETS ────────────────────────────────────────────────────

export interface GenrePreset {
  genre: ReconstructionGenre;
  defaultStyle: MasterVisualStyle;
  defaultNarrativeLens: NarrativeLens;
  defaultAmbientMood: MusicMood;
  defaultClimaxMood: MusicMood;
  suggestedTopics: string[];
}

export const GENRE_PRESETS: Record<ReconstructionGenre, GenrePreset> = {
  [ReconstructionGenre.HISTORICAL_RECONSTRUCTION]: {
    genre: ReconstructionGenre.HISTORICAL_RECONSTRUCTION,
    defaultStyle: MasterVisualStyle.EPIC_PAINTERLY,
    defaultNarrativeLens: NarrativeLens.ORIGIN_STORY,
    defaultAmbientMood: MusicMood.EPIC,
    defaultClimaxMood: MusicMood.INSPIRING,
    suggestedTopics: [
      "سقوط روم باستان",
      "جنگ جهانی دوم: نبرد استالینگراد",
      "انقلاب فرانسه",
      "اکتشاف قاره آمریکا",
      "صلیبیون و بیت المقدس",
    ],
  },
  [ReconstructionGenre.CRIMINAL_CASEFILE]: {
    genre: ReconstructionGenre.CRIMINAL_CASEFILE,
    defaultStyle: MasterVisualStyle.FORENSIC,
    defaultNarrativeLens: NarrativeLens.WHY_MYSTERY,
    defaultAmbientMood: MusicMood.SUSPENSE,
    defaultClimaxMood: MusicMood.DARK,
    suggestedTopics: [
      "پرونده Jack the Ripper",
      "پرونده Zodiac Killer",
      "اختفای D.B. Cooper",
      "پرونده سریال قتل‌های شیکاگو",
      "پرونده Elizabeth Báthory",
    ],
  },
  [ReconstructionGenre.LOST_CIVILIZATIONS]: {
    genre: ReconstructionGenre.LOST_CIVILIZATIONS,
    defaultStyle: MasterVisualStyle.ARCHAEOLOGICAL,
    defaultNarrativeLens: NarrativeLens.HIDDEN_DISCOVERY,
    defaultAmbientMood: MusicMood.MYSTERIOUS,
    defaultClimaxMood: MusicMood.ADVENTURE,
    suggestedTopics: [
      "آتلانتیس — شهر گم‌شده",
      "پوم‌پیئی: آخرین روز",
      "تمدن مایا و ناباودی آن",
      "شهر زیرزمینی کاپادوکیا",
      "موهنجوداری و تمدن Indus",
    ],
  },
  [ReconstructionGenre.UNSOLVED_MYSTERIES]: {
    genre: ReconstructionGenre.UNSOLVED_MYSTERIES,
    defaultStyle: MasterVisualStyle.DARK_DOCUMENTARY,
    defaultNarrativeLens: NarrativeLens.UNSOLVED_ENIGMA,
    defaultAmbientMood: MusicMood.MYSTERIOUS,
    defaultClimaxMood: MusicMood.SUSPENSE,
    suggestedTopics: [
      "خطوط نازکا — چرا؟",
      "کتاب Voynich",
      "مثلث بیرموتا",
      "سنگ‌های استونهنج",
      "پیام‌های رمز شیکاگو",
    ],
  },
};

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────

/**
 * هر 30 ثانیه یک فصل (عکس/پازل). 30s intro + 30s outro حذف میشه.
 *   8 دقیقه  → 16 فصل
 *  10 دقیقه  → 20 فصل
 *  12 دقیقه  → 24 فصل
 *  15 دقیقه  → 30 فصل
 */
export function calcChapterCount(durationMinutes: number): number {
  const usableSeconds = durationMinutes * 60 - 60; // حذف intro/outro
  return Math.floor(usableSeconds / 30); // هر 30 ثانیه یک فصل
}

export function assignChapterRoles(totalChapters: number): ChapterRole[] {
  const roles: ChapterRole[] = new Array(totalChapters).fill(ChapterRole.RISING_ACTION);
  roles[0] = ChapterRole.HOOK;
  roles[totalChapters - 1] = ChapterRole.CONCLUSION;
  const climaxIndex = Math.floor(totalChapters * 0.7);
  const revealIndex = Math.min(climaxIndex + 1, totalChapters - 2);
  roles[climaxIndex] = ChapterRole.CLIMAX;
  roles[revealIndex] = ChapterRole.REVEAL;
  return roles;
}

export function getChapterComplexity(role: ChapterRole): "easy" | "medium" | "hard" {
  switch (role) {
    case ChapterRole.HOOK:
      return "easy";
    case ChapterRole.RISING_ACTION:
      return "medium";
    case ChapterRole.CLIMAX:
      return "hard";
    case ChapterRole.REVEAL:
      return "medium";
    case ChapterRole.CONCLUSION:
      return "easy";
  }
}

export function getChapterTransition(role: ChapterRole): ChapterTransition {
  switch (role) {
    case ChapterRole.HOOK:
      return ChapterTransition.FADE_TEXT;
    case ChapterRole.RISING_ACTION:
      return ChapterTransition.FADE_TEXT;
    case ChapterRole.CLIMAX:
      return ChapterTransition.PARTICLE_DISSOLVE;
    case ChapterRole.REVEAL:
      return ChapterTransition.TIMELINE_PULSE;
    case ChapterRole.CONCLUSION:
      return ChapterTransition.FADE_TEXT;
  }
}

export function getPieceCountForComplexity(
  complexity: "easy" | "medium" | "hard",
  basePieceCount: number,
): number {
  switch (complexity) {
    case "easy":
      return Math.floor(basePieceCount * 0.7);
    case "medium":
      return basePieceCount;
    case "hard":
      return Math.floor(basePieceCount * 1.4);
  }
}
