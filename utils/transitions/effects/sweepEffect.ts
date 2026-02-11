import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

/**
 * 🧹 SWEEP EFFECT - افکت جاروزدن طبیعی
 *
 * ✅ بدون نمایش جارو - فقط افکت جاروزدن
 * ✅ حفظ کامل اندازه قطعات
 * ✅ حرکت نرم و طبیعی
 * ✅ متغیرهای تصادفی
 */
export const sweepEffect: TransitionEffect = {
  type: TransitionType.SWEEP,
  duration: 5000, // 6 ثانیه برای جاروزدن آرام‌تر

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    // 🎲 متغیرهای تصادفی
    const sweepDirection = Math.random() > 0.5 ? 1 : -1;
    const sweepSpeed = 0.7 + Math.random() * 0.3; // آهسته‌تر: 0.7-1.0
    const waveIntensity = 0.5 + Math.random() * 0.5; // شدت موج: 0.5-1.0
    const startDelay = Math.random() * 0.3; // تأخیر شروع

    console.log(
      `🧹 Sweep: ${sweepDirection === 1 ? "→" : "←"} | Speed: ${sweepSpeed.toFixed(2)} | Wave: ${waveIntensity.toFixed(2)}`,
    );

    // جاذبه بسیار کم
    engine.world.gravity.y = 0.008;
    engine.world.gravity.x = 0;

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      // ✅ حفظ کامل اندازه - بدون هیچ تغییری
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw, // ✅ اندازه اصلی
        piece.ph, // ✅ اندازه اصلی
        {
          restitution: 0.05,
          friction: 0.4,
          frictionAir: 0.03,
          density: 0.0008,
          collisionFilter: {
            group: -1,
            category: 0,
            mask: 0,
          },
        },
      );

      // محاسبه تأخیر بر اساس موقعیت
      const normalizedX = sweepDirection === 1 ? piece.tx / canvasWidth : 1 - piece.tx / canvasWidth;

      const normalizedY = piece.ty / canvasHeight;
      const positionDelay = normalizedX * 0.5 + normalizedY * 0.1;

      (body as any)._sweepDelay = startDelay + positionDelay;
      (body as any)._sweepDirection = sweepDirection;
      (body as any)._sweepSpeed = sweepSpeed;
      (body as any)._waveIntensity = waveIntensity;
      (body as any)._rotationSpeed = 0.05 + Math.random() * 0.1;
      (body as any)._verticalWave = Math.random() * Math.PI * 2;

      body.pieceId = piece.id;
      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);

    (engine as any)._transitionType = "SWEEP";
    (engine as any)._transitionStartTime = Date.now();
    (engine as any)._physicsEnabled = true;
    (engine as any)._sweepDirection = sweepDirection;

    // تابع اعمال نیروی جاروزدن
    const applySweepForces = () => {
      const elapsed = (Date.now() - (engine as any)._transitionStartTime) / 1000;
      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body: any) => {
        if (body.isStatic) return;

        const delay = body._sweepDelay || 0;
        const adjustedTime = elapsed - delay;

        if (adjustedTime < 0) return;

        const direction = body._sweepDirection || 1;
        const speed = body._sweepSpeed || 1;
        const waveIntensity = body._waveIntensity || 1;
        const rotationSpeed = body._rotationSpeed || 0.08;
        const verticalWave = body._verticalWave || 0;

        // فاز 1: شروع آرام (0-1s)
        if (adjustedTime < 1.0) {
          const progress = adjustedTime / 1.0;
          const easeProgress = progress * progress; // ease in

          const horizontalForce = direction * 0.04 * easeProgress * speed;
          const waveY = Math.sin(adjustedTime * Math.PI * 2 + verticalWave) * 0.008 * waveIntensity;

          Matter.Body.applyForce(body, body.position, {
            x: horizontalForce,
            y: waveY,
          });

          const angular = direction * 0.0003 * rotationSpeed * easeProgress;
          Matter.Body.setAngularVelocity(body, body.angularVelocity + angular);
        }

        // فاز 2: جاروزدن اصلی (1-4.5s)
        else if (adjustedTime >= 1.0 && adjustedTime < 4.5) {
          const phaseTime = adjustedTime - 1.0;
          const phaseProgress = phaseTime / 3.5;

          const baseForce = 0.08 + phaseProgress * 0.04;
          const horizontalForce = direction * baseForce * speed;

          const waveY = Math.sin(phaseTime * Math.PI * 1.5 + verticalWave) * 0.012 * waveIntensity;
          const drift = Math.sin(phaseTime * Math.PI * 0.8) * 0.005;

          Matter.Body.applyForce(body, body.position, {
            x: horizontalForce,
            y: waveY + drift,
          });

          const angular = direction * 0.0006 * rotationSpeed;
          Matter.Body.setAngularVelocity(body, body.angularVelocity + angular);
        }

        // فاز 3: تسریع نهایی (4.5-6s)
        else if (adjustedTime >= 4.5) {
          const phaseTime = adjustedTime - 4.5;
          const phaseProgress = phaseTime / 1.5;
          const easeProgress = 1 - (1 - phaseProgress) * (1 - phaseProgress); // ease out

          const acceleratedForce = 0.12 + easeProgress * 0.15;
          const horizontalForce = direction * acceleratedForce * speed;

          const waveY = Math.sin(phaseTime * Math.PI * 2.5 + verticalWave) * 0.01 * waveIntensity;

          Matter.Body.applyForce(body, body.position, {
            x: horizontalForce,
            y: waveY - 0.008, // کمی به سمت بالا
          });

          const angular = direction * 0.001 * rotationSpeed * (1 + easeProgress);
          Matter.Body.setAngularVelocity(body, body.angularVelocity + angular);
        }
      });
    };

    (engine as any)._sweepForceApplier = applySweepForces;
  },
};
