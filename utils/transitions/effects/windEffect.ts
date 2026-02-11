import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

/**
 * 🌬️ WIND EFFECT - FINAL VERSION
 *
 * ✅ بدون تغییر اندازه قطعات
 * ✅ بدون فاصله انداختن بین قطعات
 * ✅ استفاده از cachedCanvas برای حفظ شکل دقیق
 * ✅ فیزیک واقع‌گرایانه و ملایم
 */
export const windEffect: TransitionEffect = {
  type: TransitionType.WIND,
  duration: 5000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // 🎲 تصادفی‌سازی جهت باد
    const windDirection = Math.random() > 0.5 ? 1 : -1;
    console.log(`🌬️ Wind Direction: ${windDirection === 1 ? "RIGHT" : "LEFT"}`);

    // جاذبه خیلی ضعیف
    engine.world.gravity.y = 0.03;
    engine.world.gravity.x = 0;

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      // ✅ استفاده دقیق از اندازه و موقعیت قطعه بدون هیچ تغییری
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2, // مرکز دقیق قطعه
        piece.ty + piece.ph / 2, // مرکز دقیق قطعه
        piece.pw, // عرض دقیق قطعه
        piece.ph, // ارتفاع دقیق قطعه
        {
          // فیزیک بسیار ملایم
          restitution: 0.02,
          friction: 0.01,
          frictionAir: 0.005,
          density: 0.0003,

          // بدون collision برای عبور آزاد
          collisionFilter: {
            group: -1,
            category: 0,
            mask: 0,
          },
        },
      );

      // تعیین مرحله بر اساس موقعیت عمودی
      const normalizedY = piece.ty / canvasHeight;
      let phase = normalizedY < 0.4 ? 2 : 3;

      // تصادفی‌سازی کم
      if (Math.random() < 0.1) {
        phase = phase === 2 ? 3 : 2;
      }

      // ذخیره اطلاعات
      (body as any)._windPhase = phase;
      (body as any)._windDirection = windDirection;
      (body as any)._randomDelay = Math.random() * 0.15;
      (body as any)._rotationFactor = 0.15 + Math.random() * 0.2;
      (body as any)._liftFactor = 0.7 + Math.random() * 0.5;

      body.pieceId = piece.id;
      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);

    // ذخیره اطلاعات ترنزیشن
    (engine as any)._transitionType = "WIND";
    (engine as any)._transitionStartTime = Date.now();
    (engine as any)._physicsEnabled = true;
    (engine as any)._windDirection = windDirection;

    // تابع اعمال نیروهای باد
    const applyWindForces = () => {
      const elapsed = (Date.now() - (engine as any)._transitionStartTime) / 1000;
      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body: any) => {
        if (body.isStatic) return;

        const phase = body._windPhase || 3;
        const delay = body._randomDelay || 0;
        const adjustedTime = elapsed - delay;
        const direction = body._windDirection || 1;
        const rotationFactor = body._rotationFactor || 0.2;
        const liftFactor = body._liftFactor || 1.0;

        if (adjustedTime < 0) return;

        // مرحله 1: نسیم ملایم (0-1.5s)
        if (adjustedTime >= 0 && adjustedTime < 1.5) {
          const trembleX = Math.sin(adjustedTime * Math.PI * 5) * 0.01;
          const trembleY = Math.cos(adjustedTime * Math.PI * 6) * 0.008;

          Matter.Body.applyForce(body, body.position, {
            x: trembleX * (0.9 + Math.random() * 0.2),
            y: trembleY,
          });
        }

        // مرحله 2: باد متوسط (1.5-3.5s)
        else if (adjustedTime >= 1.5 && adjustedTime < 3.5 && phase === 2) {
          const phaseProgress = (adjustedTime - 1.5) / 2.0;

          const liftForce = 0.06 * phaseProgress * liftFactor;
          const horizontalForce = 0.1 * phaseProgress * (0.95 + Math.random() * 0.1);
          const waveY = Math.sin(adjustedTime * Math.PI * 1.8) * 0.015;

          Matter.Body.applyForce(body, body.position, {
            x: direction * horizontalForce,
            y: -liftForce + waveY,
          });

          const angularForce = direction * 0.0006 * rotationFactor * phaseProgress;
          Matter.Body.setAngularVelocity(body, body.angularVelocity + angularForce);
        }

        // مرحله 3: باد شدید (3.5-5s)
        else if (adjustedTime >= 3.5) {
          const phaseProgress = (adjustedTime - 3.5) / 1.5;

          const horizontalForce = (0.25 + phaseProgress * 0.4) * (0.95 + Math.random() * 0.1);
          const liftForce = 0.04 * (1 - phaseProgress * 0.6);
          const waveY = Math.sin(adjustedTime * Math.PI * 1.2) * 0.01;

          Matter.Body.applyForce(body, body.position, {
            x: direction * horizontalForce,
            y: -liftForce + waveY,
          });

          const angularForce = direction * 0.0015 * rotationFactor * (1 + phaseProgress * 0.3);
          Matter.Body.setAngularVelocity(body, body.angularVelocity + angularForce);
        }
      });
    };

    (engine as any)._windForceApplier = applyWindForces;
  },
};
