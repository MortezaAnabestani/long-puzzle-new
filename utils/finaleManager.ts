/**
 * 🎬 FINALE MANAGER V3 - با زمان‌بندی صحیح و تضمین پایان ویدئو
 *
 * ترتیب رویدادها در آخرین پازل:
 * 1. پازل تکمیل می‌شود
 * 2. پاز کوتاه (FINALE_PAUSE)
 * 3. موج پازل + فروریختن (WAVE_DURATION)
 * 4. پاز کوتاه قبل از اسلایدشو (SLIDESHOW_DELAY)
 * 5. اسلایدشو شروع می‌شود
 * 6. کارت پایانی
 * 7. پایان و شروع دانلود
 */

import { Piece } from "../hooks/usePuzzleLogic";

export interface FinalePhaseState {
  isFinale: boolean;
  pauseActive: boolean;
  waveActive: boolean;
  waveProgress: number;
  slideshowActive: boolean;
  currentSlide: number;
  slideProgress: number;
  outroActive: boolean;
  outroProgress: number;
  isComplete: boolean;
  zoomScale: number;
}

// ⏱️ تایمینگ‌ها
export const FINALE_PAUSE = 800; // پاز اولیه بعد از تکمیل پازل
export const WAVE_DURATION = 3000; // مدت زمان موج + فروریختن
export const SLIDESHOW_DELAY = 300; // تاخیر قبل از شروع اسلایدشو
export const SLIDE_DURATION = 1200; // مدت زمان هر اسلاید (افزایش داده شد برای دیدن بهتر)
export const OUTRO_DURATION = 3000; // کارت پایانی
export const TOTAL_SLIDES = 14; // تعداد اسلایدها (14 فصل)
export const SLIDESHOW_DURATION = TOTAL_SLIDES * SLIDE_DURATION;

// محاسبه زمان‌های کلیدی
export const WAVE_START_TIME = FINALE_PAUSE;
export const WAVE_END_TIME = WAVE_START_TIME + WAVE_DURATION;
export const SLIDESHOW_START_TIME = WAVE_END_TIME + SLIDESHOW_DELAY;
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

  // 🌊 فاز 2: موج + فروریختن
  const waveElapsed = Math.max(0, t - WAVE_START_TIME);
  const waveProgress = Math.min(waveElapsed / WAVE_DURATION, 1);
  const waveActive = t > WAVE_START_TIME && t < WAVE_END_TIME;

  // زوم دوربین تدریجی
  const zoomScale = 1 + t / 100000; // زوم بسیار آهسته

  // 📺 فاز 3: اسلایدشو (بعد از اتمام موج)
  const slideshowElapsed = Math.max(0, t - SLIDESHOW_START_TIME);
  const slideshowActive = t >= SLIDESHOW_START_TIME && t < SLIDESHOW_END_TIME;
  const currentSlide = Math.min(Math.floor(slideshowElapsed / SLIDE_DURATION), TOTAL_SLIDES - 1);
  const slideProgress = (slideshowElapsed % SLIDE_DURATION) / SLIDE_DURATION;

  // 🎬 فاز 4: کارت پایانی
  const outroElapsed = Math.max(0, t - OUTRO_START_TIME);
  const outroProgress = Math.min(outroElapsed / OUTRO_DURATION, 1);
  const outroActive = t >= OUTRO_START_TIME && t < OUTRO_END_TIME;

  // ✅ فاز 5: پایان کامل
  const isComplete = t >= TOTAL_FINALE_DURATION;

  return {
    isFinale,
    pauseActive,
    waveActive,
    waveProgress,
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
 * محاسبه Y موج مورب برای هر قطعه
 */
export const getDiagonalWaveY = (p: Piece, t: number, vWidth: number, vHeight: number): number => {
  if (t < WAVE_START_TIME) return 0;

  const waveElapsed = t - WAVE_START_TIME;
  const waveT = Math.min(waveElapsed / WAVE_DURATION, 1);

  // موج مورب از بالا چپ به پایین راست
  const diagonalPos = (p.tx + p.ty) / (vWidth + vHeight);
  const waveDelay = diagonalPos * 0.5; // تاخیر بر اساس موقعیت مورب

  const localT = Math.max(0, Math.min((waveT - waveDelay) / 0.5, 1));

  // محاسبه ارتفاع موج
  const amplitude = 30; // ارتفاع موج
  const frequency = 4; // تعداد موج‌ها
  const waveY = Math.sin(localT * Math.PI * frequency) * amplitude * (1 - localT);

  // فروریختن تدریجی بعد از موج
  const fallY = localT * vHeight * 1.5;

  return waveY + fallY;
};

/**
 * لاگ تایمینگ برای دیباگ
 */
export const logFinaleTimeline = () => {
  console.log("📅 [Finale Timeline V3]");
  console.log(`  0ms - ${FINALE_PAUSE}ms: Initial pause`);
  console.log(`  ${WAVE_START_TIME}ms - ${WAVE_END_TIME}ms: Wave + Collapse`);
  console.log(`  ${WAVE_END_TIME}ms - ${SLIDESHOW_START_TIME}ms: Pre-slideshow delay`);
  console.log(`  ${SLIDESHOW_START_TIME}ms - ${SLIDESHOW_END_TIME}ms: Slideshow (${TOTAL_SLIDES} slides)`);
  console.log(`  ${OUTRO_START_TIME}ms - ${OUTRO_END_TIME}ms: Outro card`);
  console.log(`  ${TOTAL_FINALE_DURATION}ms+: Complete & Download`);
  console.log(
    `  Total finale duration: ${TOTAL_FINALE_DURATION}ms (${(TOTAL_FINALE_DURATION / 1000).toFixed(1)}s)`,
  );
};
