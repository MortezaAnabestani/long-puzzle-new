export enum TransitionType {
  WIND = "WIND",
  COLLAPSE = "COLLAPSE",
  EXPLOSION = "EXPLOSION",
  SPIRAL = "SPIRAL",
  WAVE = "WAVE",
  GRAVITY = "GRAVITY",
  MAGNET = "MAGNET",
  TORNADO = "TORNADO",
  IMPLOSION = "IMPLOSION",
  SCATTER = "SCATTER",
  SWEEP = "SWEEP",
}

export interface PuzzlePiece {
  id: number;
  tx: number;
  ty: number;
  pw: number;
  ph: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  zOrder: number;
}

export interface TransitionEffect {
  type: TransitionType;
  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => void;
  duration: number; // in milliseconds
}

export interface TransitionConfig {
  waitTime: number; // time to wait after puzzle completion (ms)
  transitionDuration: number; // duration of transition (ms)
  fadeOutDuration: number; // fade out duration (ms)
}

export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  waitTime: 0, // ✅ بدون تأخیر! بلافاصله شروع می‌شود
  transitionDuration: 4000, // 4 ثانیه ترنزیشن
  fadeOutDuration: 500,
};
