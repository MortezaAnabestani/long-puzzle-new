/**
 * 🎨 TRANSITION RENDERER PRO - UPGRADED
 *
 * رندر کردن افکت‌های ترنزیشن با پشتیبانی کامل از فیزیک Matter.js
 * شامل: رندر قطعات، افکت‌های بصری پیشرفته، و fade out نهایی
 * بهینه‌سازی شده برای جذابیت بصری و سرگرمی
 */

export const renderTransition = (
  ctx: CanvasRenderingContext2D,
  transitionType: string,
  progress: number, // 0 to 1
  canvasWidth: number,
  canvasHeight: number,
  engine: any, // Matter.js engine
  pieces: any[], // آرایه قطعات اصلی برای رندر
): void => {
  if (progress >= 1) return;

  switch (transitionType) {
    case "SWEEP":
      renderSweep(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
  }

  // ✅ Fade out نهایی - فقط در آخرین 1 ثانیه (20% آخر از 5 ثانیه)
  if (progress > 0.8) {
    const fadeProgress = (progress - 0.8) / 0.2; // 0 to 1
    ctx.globalAlpha = fadeProgress;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.globalAlpha = 1;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🧹 SWEEP EFFECT RENDERER - افکت جاروزدن بدون نمایش جارو
// ═══════════════════════════════════════════════════════════════════════════
const renderSweep = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number,
  engine: any,
  pieces: any[],
): void => {
  if (!engine || typeof window === "undefined") return;
  const Matter = (window as any).Matter;
  if (!Matter) return;
  if (engine._sweepForceApplier) {
    engine._sweepForceApplier();
  }
  const bodies = Matter.Composite.allBodies(engine.world);

  ctx.save();

  // ✅ رندر قطعات با اندازه کامل و دقیق - بدون هیچ تغییری
  bodies.forEach((body: any) => {
    if (body.isStatic) return;

    const pieceId = body.pieceId;
    const piece = pieces.find((p: any) => p.id === pieceId);
    if (!piece) return;

    ctx.save();

    // محاسبه opacity بر اساس خروج از صفحه
    let opacity = 1;
    const fadeMargin = 250;

    if (body.position.x < -fadeMargin || body.position.x > width + fadeMargin) {
      const distance =
        body.position.x < 0
          ? Math.abs(body.position.x + fadeMargin)
          : Math.abs(body.position.x - width - fadeMargin);
      opacity = Math.max(0, 1 - distance / fadeMargin);
    }

    if (body.position.y < -fadeMargin || body.position.y > height + fadeMargin) {
      const distanceY =
        body.position.y < 0
          ? Math.abs(body.position.y + fadeMargin)
          : Math.abs(body.position.y - height - fadeMargin);
      opacity = Math.min(opacity, Math.max(0, 1 - distanceY / fadeMargin));
    }

    ctx.globalAlpha = opacity;
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    // ✅ استفاده از cachedCanvas برای حفظ شکل دقیق قطعه
    if (piece.cachedCanvas) {
      ctx.drawImage(
        piece.cachedCanvas,
        -piece.pw, // ✅ اندازه اصلی - بدون تغییر
        -piece.ph, // ✅ اندازه اصلی - بدون تغییر
        piece.pw * 2.2, // ✅ عرض اصلی - بدون تغییر
        piece.ph * 2.2, // ✅ ارتفاع اصلی - بدون تغییر
      );
    } else if (piece.img) {
      // fallback: استفاده از تصویر اصلی
      ctx.drawImage(
        piece.img,
        piece.sx,
        piece.sy,
        piece.sw,
        piece.sh,
        -piece.pw, // ✅ اندازه اصلی - بدون تغییر
        -piece.ph, // ✅ اندازه اصلی - بدون تغییر
        piece.pw * 2.2, // ✅ عرض اصلی - بدون تغییر
        piece.ph * 2.2, // ✅ ارتفاع اصلی - بدون تغییر
      );
    }

    ctx.restore();
  });

  ctx.restore();
};
