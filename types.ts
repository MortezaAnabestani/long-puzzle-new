
export enum ArtStyle {
  MANDALA = 'Detailed Mandala',
  STAINED_GLASS = 'Stained Glass Art',
  CYBERPUNK = 'Cyberpunk Illustration',
  WATERCOLOR = 'Professional Watercolor',
  ANIME = 'High-End Anime Scene',
  OIL_PAINTING = 'Classical Oil Painting',
  VECTOR_ART = 'Clean Vector Art',
  HYPER_REALISTIC = 'Hyper-Realistic Photo'
}

export enum PieceShape {
  SQUARE = 'Square',
  TRIANGLE = 'Triangle',
  HEXAGON = 'Hexagon',
  DIAMOND = 'Diamond',
  BRICK = 'Brick/Rectangle',
  CHEVRON = 'Chevron',
  JIGSAW = 'True Interlocking'
}

export enum PieceMaterial {
  CARDBOARD = 'Classic Cardboard',
  WOOD = 'Polished Oak',
  GLASS = 'Frosted Glass',
  CARBON = 'Carbon Fiber'
}

export enum MovementType {
  STANDARD = 'Realistic',
  FLIGHT = 'Flight (Swoop)',
  WAVE = 'Ocean Wave',
  PLAYFUL = 'Bouncy Playful',
  VORTEX = 'Spiral Vortex',
  ELASTIC = 'Elastic Pop'
}

export enum PuzzleBackground {
  FROSTED_DISCOVERY = 'Frosted Discovery'
}

export enum TopicType {
  BREAKING = 'Breaking Signal',
  VIRAL = 'Viral Trend',
  MANUAL = 'Custom Entry',
  NARRATIVE = 'Historical Discovery'
}

export enum StorySource {
  AI_DISCOVERY = 'AI_DISCOVERY',
  TOPIC_GUIDE = 'TOPIC_GUIDE',
  DIRECT_PROMPT = 'DIRECT_PROMPT'
}

export enum NarrativeLens {
  HIDDEN_DISCOVERY = 'Hidden Discovery',
  WHY_MYSTERY = 'Why Mystery',
  COMPARISON = 'Comparison Reveal',
  UNSOLVED_ENIGMA = 'Unsolved Enigma',
  TRANSFORMATION = 'Before/After Transformation',
  COUNTDOWN = 'Top N Countdown',
  ORIGIN_STORY = 'Origin Story'
}

export enum MusicMood {
  MYSTERIOUS = 'Mysterious Ambient',
  EPIC = 'Epic Cinematic',
  CALM = 'Calm Atmospheric',
  SUSPENSE = 'Suspenseful Tension',
  INSPIRING = 'Inspiring Uplifting',
  DARK = 'Dark Intense'
}

export interface StoryArc {
  hook: string;
  buildup: string[];
  climax: string;
  reveal: string;
}

export interface ContentTheme {
  category: string;
  topic: string;
  visualElements: string[];
  keyFacts: string[];
  narrativeLens: NarrativeLens;
  musicMood: MusicMood;
}

export enum BackendMode {
  JSON = 'json',
  ALL = 'all'
}

export interface PuzzleState {
  isGenerating: boolean;
  isSolving: boolean;
  isRecording: boolean;
  progress: number;
  imageUrl: string | null;
  error: string | null;
}

export interface UserPreferences {
  style: ArtStyle;
  subject: string;
  durationMinutes: number;
  pieceCount: number;
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  background: PuzzleBackground;
  topicType?: TopicType;
  topicCategory?: string;
  showDocumentaryTips?: boolean;
  narrativeLens?: NarrativeLens;
}
