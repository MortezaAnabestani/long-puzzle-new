/**
 * 🎬 FINALE MANAGER V4 - با موج، فروریختن Matter.js و اسلایدشو
 *
 * ترتیب رویدادها در آخرین پازل:
 * 1. پازل تکمیل می‌شود
 * 2. مکث 2 ثانیه روی پازل تکمیل شده
 * 3. پاز کوتاه (FINALE_PAUSE)
 * 4. موج بالا رونده (WAVE_DURATION)
 * 5. فروریختن با Matter.js (COLLAPSE_DURATION)
 * 6. اسلایدشو با carousel (SLIDESHOW_DURATION)
 * 7. کارت پایانی (OUTRO_DURATION)
 * 8. پایان و دانلود
 */

import { Piece } from "../hooks/usePuzzleLogic";

export interface FinalePhaseState {
  isFinale: boolean;
  pauseActive: boolean;
  waveActive: boolean;
  waveProgress: number;
  collapseActive: boolean;
  collapseProgress: number;
  slideshowActive: boolean;
  currentSlide: number;
  slideProgress: number;
  outroActive: boolean;
  outroProgress: number;
  isComplete: boolean;
  zoomScale: number;
}

// ⏱️ تایمینگ‌های فاز نهایی
export const COMPLETION_PAUSE = 2000; // 2 ثانیه مکث روی پازل تکمیل شده (در transition)
export const FINALE_PAUSE = 1800; // پاز اولیه بعد از تکمیل پازل
export const WAVE_DURATION = 3500; // مدت زمان موج (بالا رفتن)
export const COLLAPSE_DURATION = 4000; // مدت زمان فروریختن با Matter.js
export const SLIDESHOW_DELAY = 500; // تاخیر قبل از شروع اسلایدشو
export const SLIDE_DURATION = 2000; // مدت زمان هر اسلاید (برای carousel)
export const OUTRO_DURATION = 3000; // کارت پایانی
export const TOTAL_SLIDES = 14; // تعداد اسلایدها (14 فصل)
export const SLIDESHOW_DURATION = TOTAL_SLIDES * SLIDE_DURATION;

// محاسبه زمان‌های کلیدی
export const WAVE_START_TIME = FINALE_PAUSE;
export const WAVE_END_TIME = WAVE_START_TIME + WAVE_DURATION;
export const COLLAPSE_START_TIME = WAVE_END_TIME;
export const COLLAPSE_END_TIME = COLLAPSE_START_TIME + COLLAPSE_DURATION;
export const SLIDESHOW_START_TIME = COLLAPSE_END_TIME + SLIDESHOW_DELAY;
export const SLIDESHOW_END_TIME = SLIDESHOW_START_TIME + SLIDESHOW_DURATION;
export const OUTRO_START_TIME = SLIDESHOW_END_TIME;
export const OUTRO_END_TIME = OUTRO_START_TIME + OUTRO_DURATION;
export const TOTAL_FINALE_DURATION = OUTRO_END_TIME;

/**
 * دریافت وضعیت فاز نهایی بر اساس زمان سپری شده
 */
export const getFinaleState = (elapsedAfterFinish: number): FinalePhaseState => {
  const t = elapsedAfterFinish;
  const isFinale = t > 0;

  // 🎬 فاز 1: پاز اولیه
  const pauseActive = t > 0 && t <= FINALE_PAUSE;

  // 🌊 فاز 2: موج بالا رونده
  const waveTime = Math.max(0, t - FINALE_PAUSE);
  const waveProgress = Math.min(waveTime / WAVE_DURATION, 1);
  const waveActive = t > WAVE_START_TIME && t < WAVE_END_TIME;

  // 💥 فاز 3: فروریختن با Matter.js
  const collapseTime = Math.max(0, t - COLLAPSE_START_TIME);
  const collapseProgress = Math.min(collapseTime / COLLAPSE_DURATION, 1);
  const collapseActive = t >= COLLAPSE_START_TIME && t < COLLAPSE_END_TIME;

  // زوم دوربین تدریجی (استاندارد)
  const zoomScale = 1 + t / 80000;

  // 📺 فاز 4: اسلایدشو
  const slideshowElapsed = Math.max(0, t - SLIDESHOW_START_TIME);
  const slideshowActive = t >= SLIDESHOW_START_TIME && t < SLIDESHOW_END_TIME;
  const currentSlide = Math.min(Math.floor(slideshowElapsed / SLIDE_DURATION), TOTAL_SLIDES - 1);
  const slideProgress = (slideshowElapsed % SLIDE_DURATION) / SLIDE_DURATION;

  // 🎬 فاز 5: کارت پایانی
  const outroElapsed = Math.max(0, t - OUTRO_START_TIME);
  const outroProgress = Math.min(outroElapsed / OUTRO_DURATION, 1);
  const outroActive = t >= OUTRO_START_TIME && t < OUTRO_END_TIME;

  // ✅ فاز 6: پایان کامل
  const isComplete = t >= TOTAL_FINALE_DURATION;

  return {
    isFinale,
    pauseActive,
    waveActive,
    waveProgress,
    collapseActive,
    collapseProgress,
    slideshowActive,
    currentSlide,
    slideProgress,
    outroActive,
    outroProgress,
    isComplete,
    zoomScale,
  };
};

/**
 * محاسبه Y موج مورب - موج به سمت بالا می‌رود (منفی)
 * این موج قطعات را به سمت بالا می‌برد و سپس به حالت اولیه بر می‌گرداند
 */
export const getDiagonalWaveY = (p: Piece, t: number, vWidth: number, vHeight: number): number => {
  if (t <= FINALE_PAUSE) return 0;

  const elapsed = t - FINALE_PAUSE;
  const individualDuration = 1400; // مدت زمان موج برای هر قطعه

  // محاسبه فاصله مورب (از بالا چپ به پایین راست)
  const diagDist = (p.tx + p.ty) / (vWidth + vHeight);

  // تاخیر شروع موج برای این قطعه
  const pieceStartDelay = diagDist * (WAVE_DURATION - individualDuration);
  const pieceElapsed = elapsed - pieceStartDelay;

  // اگر موج به این قطعه رسیده است
  if (pieceElapsed > 0 && pieceElapsed < individualDuration) {
    // استفاده از sine برای حرکت نرم بالا و پایین
    const ease = Math.sin((pieceElapsed / individualDuration) * Math.PI);
    return -ease * 65; // منفی = بالا رفتن، 65 پیکسل دامنه
  }

  return 0;
};

/**
 * لاگ تایمینگ برای دیباگ
 */
export const logFinaleTimeline = () => {
  console.log("📅 [Finale Timeline V4]");
  console.log(`  0ms - ${FINALE_PAUSE}ms: Initial pause`);
  console.log(`  ${WAVE_START_TIME}ms - ${WAVE_END_TIME}ms: Wave (upward motion)`);
  console.log(`  ${COLLAPSE_START_TIME}ms - ${COLLAPSE_END_TIME}ms: Matter.js Collapse`);
  console.log(`  ${COLLAPSE_END_TIME}ms - ${SLIDESHOW_START_TIME}ms: Pre-slideshow delay`);
  console.log(
    `  ${SLIDESHOW_START_TIME}ms - ${SLIDESHOW_END_TIME}ms: Carousel Slideshow (${TOTAL_SLIDES} slides)`,
  );
  console.log(`  ${OUTRO_START_TIME}ms - ${OUTRO_END_TIME}ms: Outro card`);
  console.log(`  ${TOTAL_FINALE_DURATION}ms+: Complete & Download`);
  console.log(
    `  Total finale duration: ${TOTAL_FINALE_DURATION}ms (${(TOTAL_FINALE_DURATION / 1000).toFixed(1)}s)`,
  );
};
