/**
 * Puzzle Slideshow System
 * نمایش اسلایدی پازل‌های تکمیل شده قبل از فینال
 */

export interface SlideshowState {
  isActive: boolean;
  currentSlide: number;
  totalSlides: number;
  slideProgress: number; // 0-1
}

const SLIDE_DURATION = 800; // هر اسلاید 800ms
const TOTAL_SLIDESHOW_DURATION = 9 * SLIDE_DURATION; // 9 پازل

export const getSlideshowState = (elapsedAfterFinish: number, totalPuzzles: number = 9): SlideshowState => {
  // اسلایدشو بعد از WAVE_DURATION + 500ms شروع میشه
  const SLIDESHOW_START = 5000; // 3500 (WAVE) + 1500 delay
  const elapsed = elapsedAfterFinish - SLIDESHOW_START;

  if (elapsed < 0 || elapsed > TOTAL_SLIDESHOW_DURATION) {
    return {
      isActive: false,
      currentSlide: -1,
      totalSlides: totalPuzzles,
      slideProgress: 0,
    };
  }

  const currentSlide = Math.floor(elapsed / SLIDE_DURATION);
  const slideProgress = (elapsed % SLIDE_DURATION) / SLIDE_DURATION;

  return {
    isActive: true,
    currentSlide,
    totalSlides: totalPuzzles,
    slideProgress,
  };
};

export const SLIDESHOW_END_TIME = 5000 + TOTAL_SLIDESHOW_DURATION; // ~12.2 ثانیه

/**
 * رندر یک اسلاید (تصویر پازل کامل)
 */
export const renderSlide = (
  ctx: CanvasRenderingContext2D,
  puzzleImage: HTMLImageElement,
  vWidth: number,
  vHeight: number,
  slideProgress: number
) => {
  ctx.save();

  // فید ورودی
  const fadeIn = Math.min(slideProgress * 3, 1);
  // فید خروجی
  const fadeOut = slideProgress > 0.7 ? 1 - (slideProgress - 0.7) / 0.3 : 1;
  const opacity = fadeIn * fadeOut;

  ctx.globalAlpha = opacity;

  // Scale effect
  const scale = 0.95 + Math.sin(slideProgress * Math.PI) * 0.05;
  ctx.translate(vWidth / 2, vHeight / 2);
  ctx.scale(scale, scale);
  ctx.translate(-vWidth / 2, -vHeight / 2);

  // رندر تصویر
  ctx.drawImage(puzzleImage, 0, 0, vWidth, vHeight);

  // لیبل شماره
  ctx.globalAlpha = opacity * 0.8;
  ctx.fillStyle = "rgba(0, 122, 204, 0.2)";
  ctx.font = "bold 120px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(0, 122, 204, 0.6)";
  ctx.lineWidth = 3;

  ctx.restore();
};
