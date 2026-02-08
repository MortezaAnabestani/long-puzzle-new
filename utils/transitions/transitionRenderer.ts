export const renderTransition = (
  ctx: CanvasRenderingContext2D,
  transitionType: string,
  progress: number, // 0 to 1
  canvasWidth: number,
  canvasHeight: number
): void => {
  if (progress >= 1) return;

  switch (transitionType) {
    case "FADE_TO_BLACK":
      renderFadeToBlack(ctx, progress, canvasWidth, canvasHeight);
      break;
    case "PAGE_TURN":
      renderPageTurn(ctx, progress, canvasWidth, canvasHeight);
      break;
    case "PIXELATE_DISSOLVE":
      renderPixelateDissolve(ctx, progress, canvasWidth, canvasHeight);
      break;
    case "WIPE":
      renderWipe(ctx, progress, canvasWidth, canvasHeight);
      break;
    case "ZOOM_OUT":
      renderZoomOut(ctx, progress, canvasWidth, canvasHeight);
      break;
  }
};

// ─── FADE TO BLACK ────────────────────────────────────────────────────
const renderFadeToBlack = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number
): void => {
  // محو کردن تدریجی
  ctx.globalAlpha = progress;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
};

// ─── PAGE TURN ────────────────────────────────────────────────────────
const renderPageTurn = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number
): void => {
  // پرده سیاه از راست به چپ
  const slideWidth = width * progress;

  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.fillRect(width - slideWidth, 0, slideWidth, height);

  // سایه برای جلوه بهتر
  if (slideWidth > 0) {
    const gradient = ctx.createLinearGradient(width - slideWidth - 50, 0, width - slideWidth, 0);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = gradient;
    ctx.fillRect(width - slideWidth - 50, 0, 50, height);
  }

  ctx.restore();
};

// ─── PIXELATE DISSOLVE ────────────────────────────────────────────────
const renderPixelateDissolve = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number
): void => {
  // پیکسلی شدن و محو شدن
  const pixelSize = Math.floor(1 + progress * 30);
  const opacity = progress;

  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#000000";

  // رسم مربع‌های تصادفی
  const cols = Math.floor(width / pixelSize);
  const rows = Math.floor(height / pixelSize);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (Math.random() < progress) {
        ctx.fillRect(i * pixelSize, j * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  ctx.globalAlpha = 1;
};

// ─── WIPE ─────────────────────────────────────────────────────────────
const renderWipe = (ctx: CanvasRenderingContext2D, progress: number, width: number, height: number): void => {
  const engine = (ctx.canvas as any)._transitionEngine;
  const direction = engine?._wipeDirection || "LEFT_TO_RIGHT";

  ctx.fillStyle = "#000000";

  if (direction === "LEFT_TO_RIGHT") {
    const wipeWidth = width * progress;
    ctx.fillRect(0, 0, wipeWidth, height);
  } else {
    const wipeHeight = height * progress;
    ctx.fillRect(0, 0, width, wipeHeight);
  }
};

// ─── ZOOM OUT ─────────────────────────────────────────────────────────
const renderZoomOut = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number
): void => {
  // زوم اوت با محو شدن
  const scale = 1 - progress * 0.3; // کوچک میشه تا 70%
  const opacity = progress;

  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
};
