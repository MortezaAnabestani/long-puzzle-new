/**
 * 🎬 FINALE MANAGER V2 - با زمان‌بندی صحیح اسلایدشو
 *
 * ترتیب رویدادها در آخرین پازل:
 * 1. پازل تکمیل می‌شود
 * 2. پاز کوتاه (FINALE_PAUSE)
 * 3. ترنزیشن باد (TRANSITION_DURATION = 5000ms)
 * 4. پاز کوتاه قبل از اسلایدشو (SLIDESHOW_DELAY)
 * 5. اسلایدشو شروع می‌شود
 * 6. پایان و شروع دانلود
 */

import { Piece } from "../hooks/usePuzzleLogic";

export interface FinalePhaseState {
  isFinale: boolean;
  pauseActive: boolean;
  transitionActive: boolean;
  transitionProgress: number;
  zoomScale: number;
  slideshowActive: boolean;
  currentSlide: number;
  slideProgress: number;
  isComplete: boolean;
}

// ⏱️ تایمینگ‌ها
export const FINALE_PAUSE = 800; // پاز اولیه بعد از تکمیل پازل
export const TRANSITION_DURATION = 5000; // مدت زمان ترنزیشن باد
export const SLIDESHOW_DELAY = 500; // تاخیر قبل از شروع اسلایدشو
export const SLIDE_DURATION = 800; // مدت زمان هر اسلاید
export const TOTAL_SLIDES = 9; // تعداد اسلایدها
export const SLIDESHOW_DURATION = TOTAL_SLIDES * SLIDE_DURATION; // 7200ms

// محاسبه زمان‌های کلیدی
export const TRANSITION_START_TIME = FINALE_PAUSE;
export const TRANSITION_END_TIME = TRANSITION_START_TIME + TRANSITION_DURATION;
export const SLIDESHOW_START_TIME = TRANSITION_END_TIME + SLIDESHOW_DELAY;
export const SLIDESHOW_END_TIME = SLIDESHOW_START_TIME + SLIDESHOW_DURATION;
export const TOTAL_FINALE_DURATION = SLIDESHOW_END_TIME;

/**
 * دریافت وضعیت فاز نهایی بر اساس زمان سپری شده
 */
export const getFinaleState = (elapsedAfterFinish: number): FinalePhaseState => {
  const t = elapsedAfterFinish;
  const isFinale = t > 0;

  // 🎬 فاز 1: پاز اولیه
  const pauseActive = t > 0 && t <= FINALE_PAUSE;

  // 🌬️ فاز 2: ترنزیشن
  const transitionElapsed = Math.max(0, t - TRANSITION_START_TIME);
  const transitionProgress = Math.min(transitionElapsed / TRANSITION_DURATION, 1);
  const transitionActive = t > TRANSITION_START_TIME && t < TRANSITION_END_TIME;

  // زوم دوربین تدریجی
  const zoomScale = 1 + t / 100000; // زوم بسیار آهسته

  // 📺 فاز 3: اسلایدشو (بعد از اتمام ترنزیشن)
  const slideshowElapsed = Math.max(0, t - SLIDESHOW_START_TIME);
  const slideshowActive = t >= SLIDESHOW_START_TIME && t < SLIDESHOW_END_TIME;
  const currentSlide = Math.floor(slideshowElapsed / SLIDE_DURATION);
  const slideProgress = (slideshowElapsed % SLIDE_DURATION) / SLIDE_DURATION;

  // ✅ فاز 4: پایان
  const isComplete = t >= SLIDESHOW_END_TIME;

  return {
    isFinale,
    pauseActive,
    transitionActive,
    transitionProgress,
    zoomScale,
    slideshowActive,
    currentSlide: Math.min(currentSlide, TOTAL_SLIDES - 1),
    slideProgress,
    isComplete,
  };
};

/**
 * این تابع دیگر استفاده نمی‌شود چون wave effect حذف شد
 * اما برای سازگاری با کد قدیمی نگه داشته می‌شود
 */
export const getDiagonalWaveY = (p: Piece, t: number, vWidth: number, vHeight: number): number => {
  return 0; // دیگر wave effect نداریم
};

/**
 * لاگ تایمینگ برای دیباگ
 */
export const logFinaleTimeline = () => {
  console.log("📅 [Finale Timeline]");
  console.log(`  0ms - ${FINALE_PAUSE}ms: Initial pause`);
  console.log(`  ${TRANSITION_START_TIME}ms - ${TRANSITION_END_TIME}ms: Wind transition`);
  console.log(`  ${TRANSITION_END_TIME}ms - ${SLIDESHOW_START_TIME}ms: Pre-slideshow delay`);
  console.log(`  ${SLIDESHOW_START_TIME}ms - ${SLIDESHOW_END_TIME}ms: Slideshow`);
  console.log(`  ${SLIDESHOW_END_TIME}ms+: Complete & Download`);
};
