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
    case "WIND":
      renderWind(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
    case "VORTEX":
      renderVortex(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
    case "WRECKING_BALL":
      renderWreckingBall(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
    case "CENTRIFUGE":
      renderCentrifuge(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
    case "REVERSE_GRAVITY":
      renderReverseGravity(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
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
        -piece.pw / 2, // ✅ اندازه اصلی - بدون تغییر
        -piece.ph / 2, // ✅ اندازه اصلی - بدون تغییر
        piece.pw, // ✅ عرض اصلی - بدون تغییر
        piece.ph, // ✅ ارتفاع اصلی - بدون تغییر
      );
    } else if (piece.img) {
      // fallback: استفاده از تصویر اصلی
      ctx.drawImage(
        piece.img,
        piece.sx,
        piece.sy,
        piece.sw,
        piece.sh,
        -piece.pw / 2, // ✅ اندازه اصلی - بدون تغییر
        -piece.ph / 2, // ✅ اندازه اصلی - بدون تغییر
        piece.pw, // ✅ عرض اصلی - بدون تغییر
        piece.ph, // ✅ ارتفاع اصلی - بدون تغییر
      );
    }

    ctx.restore();
  });

  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════════════════
// 🌬️ WIND EFFECT RENDERER - Three-Phase Wind Transition
// ═══════════════════════════════════════════════════════════════════════════
const renderWind = (
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

  const bodies = Matter.Composite.allBodies(engine.world);
  const windDirection = (engine as any)._windDirection || 1;

  ctx.save();

  // 🌬️ خطوط باد
  let windLineOpacity = 0;
  let windLineCount = 5;
  let windLineSpeed = 1;

  if (progress < 0.3) {
    windLineOpacity = 0.06 + progress * 0.2;
    windLineCount = 2;
    windLineSpeed = 0.6;
  } else if (progress < 0.7) {
    windLineOpacity = 0.1 + (progress - 0.3) * 0.15;
    windLineCount = 4;
    windLineSpeed = 1.2;
  } else {
    windLineOpacity = 0.12 + (progress - 0.7) * 0.18;
    windLineCount = 7;
    windLineSpeed = 2.5;
  }

  ctx.strokeStyle = `rgba(220, 235, 255, ${windLineOpacity})`;
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";

  for (let i = 0; i < windLineCount; i++) {
    const baseY = (height / (windLineCount + 1)) * (i + 1);
    const y = baseY + ((progress * 60 * windLineSpeed) % (height / windLineCount));
    const waveOffset = Math.sin(progress * Math.PI * 2.5 + i * 0.7) * 12;

    ctx.beginPath();

    const startX = windDirection > 0 ? -40 : width + 40;
    const endX = windDirection > 0 ? width + 120 : -120;

    const segments = 20;
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const x = startX + (endX - startX) * t;
      const wave1 = Math.sin(t * Math.PI * 2 + progress * Math.PI * 3) * waveOffset;
      const wave2 = Math.sin(t * Math.PI * 3.5 + progress * Math.PI * 1.8) * (waveOffset * 0.25);
      const yOffset = wave1 + wave2;

      if (j === 0) ctx.moveTo(x, y + yOffset);
      else ctx.lineTo(x, y + yOffset);
    }

    ctx.stroke();
  }

  // 🍃 ذرات کوچک
  if (progress > 0.2) {
    const particleOpacity = Math.min(0.25, (progress - 0.2) * 0.5);
    const particleCount = Math.floor(progress * 12);

    for (let i = 0; i < particleCount; i++) {
      const seed = i * 157.3891;
      const particleProgress = (progress * 1.8 + seed * 0.08) % 1;

      const startX = windDirection > 0 ? -40 : width + 40;
      const x = startX + windDirection * particleProgress * (width + 80);
      const y = (seed * 11.3) % height;
      const size = 0.8 + (seed % 1.5);

      const alpha = particleOpacity * (1 - Math.abs(particleProgress - 0.5) * 2);
      ctx.fillStyle = `rgba(200, 215, 230, ${alpha})`;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(progress * Math.PI * 2.5 + seed);
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ✅ رندر قطعات با اندازه دقیق
  bodies.forEach((body: any) => {
    if (body.isStatic) return;

    const pieceId = body.pieceId;
    const piece = pieces.find((p: any) => p.id === pieceId);
    if (!piece) return;

    ctx.save();

    // opacity بر اساس خروج از صفحه
    let opacity = 1;
    const fadeMargin = 200;

    if (body.position.x < -fadeMargin || body.position.x > width + fadeMargin) {
      const distance =
        body.position.x < 0
          ? Math.abs(body.position.x + fadeMargin)
          : Math.abs(body.position.x - width - fadeMargin);
      opacity = Math.max(0, 1 - distance / fadeMargin);
    }

    if (body.position.y < -fadeMargin) {
      const distance = Math.abs(body.position.y + fadeMargin);
      opacity = Math.min(opacity, Math.max(0, 1 - distance / fadeMargin));
    }

    ctx.globalAlpha = opacity;
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    // ✅ CRITICAL: استفاده از cachedCanvas برای حفظ شکل دقیق
    if (piece.cachedCanvas) {
      ctx.drawImage(piece.cachedCanvas, -piece.pw / 2, -piece.ph / 2, piece.pw, piece.ph);
    } else if (piece.img) {
      // fallback: استفاده از تصویر اصلی
      ctx.drawImage(
        piece.img,
        piece.sx,
        piece.sy,
        piece.sw,
        piece.sh,
        -piece.pw / 2,
        -piece.ph / 2,
        piece.pw,
        piece.ph,
      );
    }

    ctx.restore();
  });

  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════════════════
// 🌪️ VORTEX EFFECT RENDERER PRO
// ═══════════════════════════════════════════════════════════════════════════
const renderVortex = (
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

  const bodies = Matter.Composite.allBodies(engine.world);
  const vortexCenter = (engine as any)._vortexCenter || { x: width / 2, y: height / 2 };
  const clockwise = (engine as any)._clockwise || 1;

  ctx.save();

  // 🌀 رسم افکت گردباد (خطوط مارپیچی متحرک)
  const spiralCount = 5;
  const maxRadius = Math.max(width, height) * 0.8;

  ctx.strokeStyle = `rgba(100, 150, 255, ${0.4 * (1 - progress)})`;
  ctx.lineWidth = 3;

  for (let i = 0; i < spiralCount; i++) {
    const angle = progress * Math.PI * 6 * clockwise + (i * Math.PI * 2) / spiralCount;
    const radius = 30 + progress * maxRadius;

    ctx.beginPath();

    // رسم مارپیچ
    for (let t = 0; t < Math.PI * 2; t += 0.1) {
      const r = radius * (1 + (t / (Math.PI * 2)) * 0.5);
      const x = vortexCenter.x + Math.cos(angle + t * clockwise) * r;
      const y = vortexCenter.y + Math.sin(angle + t * clockwise) * r;

      if (t === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  // ⭐ رسم ستاره‌های کوچک (برای جلوه بصری)
  ctx.fillStyle = `rgba(150, 200, 255, ${0.6 * (1 - progress)})`;
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + progress * Math.PI * 4;
    const dist = 40 + ((progress * 200 + i * 15) % 400);
    const x = vortexCenter.x + Math.cos(angle) * dist;
    const y = vortexCenter.y + Math.sin(angle) * dist;

    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.sin(progress * Math.PI * 10 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // ✅ رندر قطعات - بدون تغییر رنگ یا opacity
  bodies.forEach((body: any) => {
    if (body.isStatic) return;

    const pieceId = body.pieceId;
    const piece = pieces.find((p: any) => p.id === pieceId);
    if (!piece || !piece.img) return;

    ctx.save();
    // ✅ opacity همیشه 1 - بدون محو شدن تدریجی
    ctx.globalAlpha = 1;

    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    ctx.drawImage(
      piece.img,
      piece.sx,
      piece.sy,
      piece.sw,
      piece.sh,
      -piece.pw / 2,
      -piece.ph / 2,
      piece.pw,
      piece.ph,
    );

    ctx.restore();
  });

  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════════════════
// 💥 WRECKING BALL EFFECT RENDERER PRO
// ═══════════════════════════════════════════════════════════════════════════
const renderWreckingBall = (
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

  const bodies = Matter.Composite.allBodies(engine.world);
  const wreckingBalls = (engine as any)._wreckingBalls || [];

  ctx.save();

  // رندر قطعات - بدون تغییر رنگ
  bodies.forEach((body: any) => {
    if (body.isStatic || (body as any)._isBall) return;

    const pieceId = body.pieceId;
    const piece = pieces.find((p: any) => p.id === pieceId);
    if (!piece || !piece.img) return;

    ctx.save();
    // ✅ opacity همیشه 1
    ctx.globalAlpha = 1;

    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    ctx.drawImage(
      piece.img,
      piece.sx,
      piece.sy,
      piece.sw,
      piece.sh,
      -piece.pw / 2,
      -piece.ph / 2,
      piece.pw,
      piece.ph,
    );

    ctx.restore();
  });

  // رندر توپ(های) ویرانگر
  wreckingBalls.forEach((ball: any, index: number) => {
    if (!ball || progress > 0.8) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress * 1.5);

    // سایه سه‌بعدی
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 12;
    ctx.shadowOffsetY = 12;

    // بدنه توپ با گرادیان
    ctx.beginPath();
    const ballRadius = (ball as any)._ballRadius || 40;
    ctx.arc(ball.position.x, ball.position.y, ballRadius, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(
      ball.position.x - ballRadius * 0.3,
      ball.position.y - ballRadius * 0.3,
      ballRadius * 0.2,
      ball.position.x,
      ball.position.y,
      ballRadius,
    );

    const color1 = index === 0 ? "#5D6D7E" : "#E74C3C";
    const color2 = index === 0 ? "#1C2833" : "#922B21";

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fill();

    // outline ضخیم
    ctx.strokeStyle = index === 0 ? "#34495E" : "#C0392B";
    ctx.lineWidth = 4;
    ctx.stroke();

    // نقاط درخشان (highlights)
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(
      ball.position.x - ballRadius * 0.4,
      ball.position.y - ballRadius * 0.4,
      ballRadius * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.restore();
  });

  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════════════════
// 🌀 CENTRIFUGE EFFECT RENDERER PRO
// ═══════════════════════════════════════════════════════════════════════════
const renderCentrifuge = (
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

  const bodies = Matter.Composite.allBodies(engine.world);
  const centrifugeCenter = (engine as any)._centrifugeCenter || { x: width / 2, y: height / 2 };
  const clockwise = (engine as any)._clockwise || 1;

  ctx.save();

  // 🌀 رسم خطوط چرخشی (اختیاری - برای جلوه بصری)
  if (progress < 0.5) {
    const opacity = (1 - progress / 0.5) * 0.3;
    ctx.strokeStyle = `rgba(150, 150, 200, ${opacity})`;
    ctx.lineWidth = 2;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + progress * Math.PI * 4 * clockwise;
      const radius = 50 + progress * 400;

      ctx.beginPath();
      ctx.moveTo(centrifugeCenter.x, centrifugeCenter.y);
      ctx.lineTo(
        centrifugeCenter.x + Math.cos(angle) * radius,
        centrifugeCenter.y + Math.sin(angle) * radius,
      );
      ctx.stroke();
    }
  }

  // رندر قطعات - بدون تغییر رنگ
  bodies.forEach((body: any) => {
    if (body.isStatic) return;

    const pieceId = body.pieceId;
    const piece = pieces.find((p: any) => p.id === pieceId);
    if (!piece || !piece.img) return;

    ctx.save();
    // ✅ opacity همیشه 1
    ctx.globalAlpha = 1;

    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    ctx.drawImage(
      piece.img,
      piece.sx,
      piece.sy,
      piece.sw,
      piece.sh,
      -piece.pw / 2,
      -piece.ph / 2,
      piece.pw,
      piece.ph,
    );

    ctx.restore();
  });

  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════════════════
// 🛸 REVERSE GRAVITY EFFECT RENDERER PRO
// ═══════════════════════════════════════════════════════════════════════════
const renderReverseGravity = (
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

  const bodies = Matter.Composite.allBodies(engine.world);

  ctx.save();

  // رندر قطعات - بدون تغییر رنگ
  bodies.forEach((body: any) => {
    if (body.isStatic) return;

    const pieceId = body.pieceId;
    const piece = pieces.find((p: any) => p.id === pieceId);
    if (!piece || !piece.img) return;

    ctx.save();
    // ✅ opacity همیشه 1
    ctx.globalAlpha = 1;

    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    ctx.drawImage(
      piece.img,
      piece.sx,
      piece.sy,
      piece.sw,
      piece.sh,
      -piece.pw / 2,
      -piece.ph / 2,
      piece.pw,
      piece.ph,
    );

    ctx.restore();
  });

  ctx.restore();
};
