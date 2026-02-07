import { Piece } from "../hooks/usePuzzleLogic";

export interface FinalePhaseState {
  isFinale: boolean;
  pauseActive: boolean;
  waveActive: boolean;
  waveProgress: number;
  zoomScale: number;
  // 🔥 NEW: Slideshow phase
  slideshowActive: boolean;
  currentSlide: number;
  slideProgress: number;
}

export const FINALE_PAUSE = 1800;
export const WAVE_DURATION = 3500;
export const SLIDE_DURATION = 800; // هر اسلاید 800ms
export const TOTAL_SLIDES = 9;
export const SLIDESHOW_DURATION = TOTAL_SLIDES * SLIDE_DURATION; // 7200ms

/**
 * مدیریت وضعیت‌های زمانی و بصری فاز نهایی
 */
export const getFinaleState = (elapsedAfterFinish: number): FinalePhaseState => {
  const t = elapsedAfterFinish;
  const isFinale = t > 0;

  const pauseActive = t > 0 && t <= FINALE_PAUSE;
  const waveTime = Math.max(0, t - FINALE_PAUSE);
  const waveProgress = Math.min(waveTime / WAVE_DURATION, 1);
  const waveActive = waveTime > 0 && waveProgress < 1;

  // زوم دوربین با نرخ ۸۰۰۰۰ (استاندارد جدید طبق درخواست کاربر)
  const zoomScale = 1 + t / 80000;

  // 🔥 SLIDESHOW: بعد از wave + 500ms delay
  const slideshowStartTime = FINALE_PAUSE + WAVE_DURATION + 500;
  const slideshowElapsed = Math.max(0, t - slideshowStartTime);
  const slideshowActive = slideshowElapsed > 0 && slideshowElapsed < SLIDESHOW_DURATION;
  const currentSlide = Math.floor(slideshowElapsed / SLIDE_DURATION);
  const slideProgress = (slideshowElapsed % SLIDE_DURATION) / SLIDE_DURATION;

  return {
    isFinale,
    pauseActive,
    waveActive,
    waveProgress,
    zoomScale,
    slideshowActive,
    currentSlide: Math.min(currentSlide, TOTAL_SLIDES - 1),
    slideProgress,
  };
};

export const getDiagonalWaveY = (p: Piece, t: number, vWidth: number, vHeight: number): number => {
  if (t <= FINALE_PAUSE) return 0;
  const elapsed = t - FINALE_PAUSE;
  const individualDuration = 1400;
  const diagDist = (p.tx + p.ty) / (vWidth + vHeight);
  const pieceStartDelay = diagDist * (WAVE_DURATION - individualDuration);
  const pieceElapsed = elapsed - pieceStartDelay;

  if (pieceElapsed > 0 && pieceElapsed < individualDuration) {
    const ease = Math.sin((pieceElapsed / individualDuration) * Math.PI);
    return -ease * 65;
  }
  return 0;
};
