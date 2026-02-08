/**
 * 🎨 TRANSITION RENDERER
 *
 * رندر کردن افکت‌های ترنزیشن با پشتیبانی از فیزیک Matter.js
 * شامل: رندر قطعات، افکت‌های بصری، و fade out نهایی
 */

export const renderTransition = (
  ctx: CanvasRenderingContext2D,
  transitionType: string,
  progress: number, // 0 to 1
  canvasWidth: number,
  canvasHeight: number,
  engine: any, // Matter.js engine
  pieces: any[] // آرایه قطعات اصلی برای رندر
): void => {
  if (progress >= 1) return;

  switch (transitionType) {
    case "VORTEX":
      renderVortex(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
    case "WRECKING_BALL":
      renderWreckingBall(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
    case "WALL_COLLAPSE":
      renderWallCollapse(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
    case "UFO_ABDUCTION":
      renderUfoAbduction(ctx, progress, canvasWidth, canvasHeight, engine, pieces);
      break;
  }

  // Fade out نهایی (در 20% آخر ترنزیشن)
  if (progress > 0.8) {
    const fadeProgress = (progress - 0.8) / 0.2; // 0 to 1
    ctx.globalAlpha = fadeProgress;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.globalAlpha = 1;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🌪️ VORTEX EFFECT RENDERER
// ═══════════════════════════════════════════════════════════════════════════
const renderVortex = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number,
  engine: any,
  pieces: any[]
): void => {
  if (!engine || typeof window === "undefined") return;
  const Matter = (window as any).Matter;
  if (!Matter) return;

  const bodies = Matter.Composite.allBodies(engine.world);

  ctx.save();

  // رسم افکت گردباد (خطوط مارپیچی شفاف)
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.strokeStyle = `rgba(100, 150, 255, ${0.3 * (1 - progress)})`;
  ctx.lineWidth = 2;

  for (let i = 0; i < 3; i++) {
    const angle = progress * Math.PI * 4 + (i * Math.PI * 2) / 3;
    const radius = 50 + progress * 300;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + i * 30, angle, angle + Math.PI / 2);
    ctx.stroke();
  }

  // رندر قطعات
  bodies.forEach((body: any, index: number) => {
    if (!pieces[index]) return;

    const piece = pieces[index];
    const opacity = Math.max(0, 1 - progress * 1.2); // محو تدریجی

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    // رسم تصویر قطعه
    const img = (piece as any).img || (piece as any).imageSrc;
    if (img) {
      ctx.drawImage(img, -piece.pw / 2, -piece.ph / 2, piece.pw, piece.ph);
    }

    ctx.restore();
  });

  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════════════════
// 💥 WRECKING BALL EFFECT RENDERER
// ═══════════════════════════════════════════════════════════════════════════
const renderWreckingBall = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number,
  engine: any,
  pieces: any[]
): void => {
  if (!engine || typeof window === "undefined") return;
  const Matter = (window as any).Matter;
  if (!Matter) return;

  const bodies = Matter.Composite.allBodies(engine.world);
  const wreckingBall = (engine as any)._wreckingBall;
  const ballRadius = (engine as any)._wreckingBallRadius || 40;

  ctx.save();

  // رندر قطعات
  bodies.forEach((body: any, index: number) => {
    // اگر این توپ است، رندر جداگانه
    if (body === wreckingBall) return;

    if (!pieces[index]) return;
    const piece = pieces[index];

    // محاسبه opacity بر اساس سرعت (قطعات سریع‌تر زودتر محو می‌شوند)
    const velocity = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    const baseOpacity = 1 - progress * 0.8;
    const velocityFade = Math.max(0, 1 - velocity / 30);
    const opacity = Math.min(baseOpacity, velocityFade);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    const img = (piece as any).img || (piece as any).imageSrc;
    if (img) {
      ctx.drawImage(img, -piece.pw / 2, -piece.ph / 2, piece.pw, piece.ph);
    }

    ctx.restore();
  });

  // رندر توپ ویرانگر
  if (wreckingBall && progress < 0.7) {
    // توپ در 70% اول نمایش داده می‌شود
    ctx.save();
    ctx.globalAlpha = 1 - progress * 1.5;

    // سایه توپ
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;

    // بدنه توپ
    ctx.beginPath();
    ctx.arc(wreckingBall.position.x, wreckingBall.position.y, ballRadius, 0, Math.PI * 2);

    // گرادیان برای حجم سه‌بعدی
    const gradient = ctx.createRadialGradient(
      wreckingBall.position.x - ballRadius * 0.3,
      wreckingBall.position.y - ballRadius * 0.3,
      ballRadius * 0.2,
      wreckingBall.position.x,
      wreckingBall.position.y,
      ballRadius
    );
    gradient.addColorStop(0, "#5D6D7E");
    gradient.addColorStop(1, "#1C2833");

    ctx.fillStyle = gradient;
    ctx.fill();

    // outline
    ctx.strokeStyle = "#34495E";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════════════════
// 🧱 WALL COLLAPSE EFFECT RENDERER (با Perspective 3D)
// ═══════════════════════════════════════════════════════════════════════════
const renderWallCollapse = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number,
  engine: any,
  pieces: any[]
): void => {
  if (!engine || typeof window === "undefined") return;
  const Matter = (window as any).Matter;
  if (!Matter) return;

  const bodies = Matter.Composite.allBodies(engine.world);
  const canvasHeight = (engine as any)._canvasHeight || height;

  ctx.save();

  // مرتب‌سازی بر اساس Z-depth (قطعات دورتر اول رسم شوند)
  const bodiesWithDepth = bodies
    .map((body: any, index: number) => {
      const pieceData = (body as any)._pieceData || { normalizedY: 0 };
      const zDepth = progress * pieceData.normalizedY * 500; // عمق بر اساس progress
      return { body, index, zDepth, pieceData };
    })
    .sort((a: any, b: any) => b.zDepth - a.zDepth);

  bodiesWithDepth.forEach(({ body, index, zDepth, pieceData }: any) => {
    if (!pieces[index]) return;
    const piece = pieces[index];

    // محاسبه perspective transformation
    const perspective = 800; // فاصله دوربین
    const scale = perspective / (perspective + zDepth);

    // محاسبه موقعیت با perspective
    const perspectiveX = width / 2 + (body.position.x - width / 2) * scale;
    const perspectiveY = canvasHeight / 2 + (body.position.y - canvasHeight / 2) * scale;

    // محاسبه opacity
    const opacity = Math.max(0, (1 - progress * 1.2) * scale);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(perspectiveX, perspectiveY);
    ctx.rotate(body.angle);
    ctx.scale(scale, scale);

    // اضافه کردن سایه برای عمق
    if (zDepth > 50) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = zDepth / 20;
      ctx.shadowOffsetY = zDepth / 30;
    }

    const img = (piece as any).img || (piece as any).imageSrc;
    if (img) {
      ctx.drawImage(img, -piece.pw / 2, -piece.ph / 2, piece.pw, piece.ph);
    }

    ctx.restore();
  });

  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════════════════
// 🛸 UFO ABDUCTION EFFECT RENDERER
// ═══════════════════════════════════════════════════════════════════════════
const renderUfoAbduction = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number,
  engine: any,
  pieces: any[]
): void => {
  if (!engine || typeof window === "undefined") return;
  const Matter = (window as any).Matter;
  if (!Matter) return;

  const bodies = Matter.Composite.allBodies(engine.world);
  const beamCenter = (engine as any)._beamCenter || { x: width / 2, y: -50 };
  const beamRadius = (engine as any)._beamRadius || width * 0.4;

  ctx.save();

  // رسم پرتو UFO (نور مخروطی از بالا)
  if (progress < 0.6) {
    const beamOpacity = (1 - progress / 0.6) * 0.3;

    ctx.save();
    ctx.globalAlpha = beamOpacity;

    // ایجاد gradient برای پرتو
    const gradient = ctx.createLinearGradient(beamCenter.x, 0, beamCenter.x, height);
    gradient.addColorStop(0, "rgba(150, 200, 255, 0.6)");
    gradient.addColorStop(0.3, "rgba(100, 150, 255, 0.3)");
    gradient.addColorStop(1, "rgba(100, 150, 255, 0)");

    ctx.fillStyle = gradient;

    // رسم شکل مخروطی پرتو
    ctx.beginPath();
    ctx.moveTo(beamCenter.x - 20, 0);
    ctx.lineTo(beamCenter.x - beamRadius, height);
    ctx.lineTo(beamCenter.x + beamRadius, height);
    ctx.lineTo(beamCenter.x + 20, 0);
    ctx.closePath();
    ctx.fill();

    // خطوط انرژی درخشان
    ctx.strokeStyle = "rgba(150, 200, 255, 0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const offset = (progress * 200 + i * 50) % 300;
      ctx.beginPath();
      ctx.moveTo(beamCenter.x - beamRadius * 0.5 + offset, offset);
      ctx.lineTo(beamCenter.x + beamRadius * 0.5 - offset, offset);
      ctx.stroke();
    }

    ctx.restore();
  }

  // رندر قطعات
  bodies.forEach((body: any, index: number) => {
    if (!pieces[index]) return;
    const piece = pieces[index];
    const beamData = (body as any)._beamData || { isInBeam: false, pullStrength: 0 };

    // قطعات داخل پرتو درخشان‌تر
    let opacity = 1 - progress * 1.2;

    if (beamData.isInBeam && progress < 0.5) {
      // افکت درخشش برای قطعات داخل پرتو
      const glow = Math.sin(progress * Math.PI * 10) * 0.3 + 0.7;
      opacity *= glow;
    }

    opacity = Math.max(0, opacity);

    ctx.save();
    ctx.globalAlpha = opacity;

    // درخشش برای قطعات در پرتو
    if (beamData.isInBeam && progress < 0.5) {
      ctx.shadowColor = "rgba(150, 200, 255, 0.8)";
      ctx.shadowBlur = 15;
    }

    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    const img = (piece as any).img || (piece as any).imageSrc;
    if (img) {
      ctx.drawImage(img, -piece.pw / 2, -piece.ph / 2, piece.pw, piece.ph);
    }

    ctx.restore();
  });

  ctx.restore();
};
