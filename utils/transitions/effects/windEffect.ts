import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

/**
 * 🌬️ WIND EFFECT - Three-Phase Wind Transition
 *
 * سه مرحله ترنزیشن باد:
 * 1. نسیم ملایم (0-1.5s): لرزش آرام قطعات در جای خود
 * 2. باد متوسط (1.5-3.5s): برخی قطعات بالایی مانند برگ به بیرون از کادر می‌روند
 * 3. باد شدید (3.5-5s): جاروب کردن همه قطعات از یک سمت
 *
 * متغیرهای تصادفی:
 * - جهت باد (چپ/راست)
 * - شدت و سرعت هر مرحله
 * - قطعاتی که زودتر می‌روند
 * - زاویه و چرخش قطعات
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

    // 🎲 تصادفی‌سازی جهت باد (چپ یا راست)
    const windDirection = Math.random() > 0.5 ? 1 : -1; // 1 = راست، -1 = چپ
    const windDirectionText = windDirection === 1 ? "RIGHT" : "LEFT";

    console.log(`🌬️ Wind Direction: ${windDirectionText}`);

    // جاذبه خیلی ضعیف (فقط برای حس طبیعی)
    engine.world.gravity.y = 0.1;
    engine.world.gravity.x = 0;

    const bodies: any[] = [];
    const totalPieces = pieces.length;

    // 📊 تقسیم‌بندی قطعات برای سه مرحله
    // مرحله 1: همه قطعات لرزش دارند
    // مرحله 2: قطعات بالایی (30% اول) زودتر می‌روند
    // مرحله 3: همه قطعات جاروب می‌شوند

    pieces.forEach((piece, index) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.1,
          friction: 0.05,
          frictionAir: 0.01,
          density: 0.0008,

          render: {
            sprite: {
              texture: (piece as any).img || (piece as any).imageSrc,
              xScale: 1,
              yScale: 1,
            },
          },

          // قطعات از هم عبور کنند
          collisionFilter: {
            group: -1,
          },
        },
      );

      // 🏷️ برچسب‌گذاری قطعات برای مراحل مختلف
      // قطعات بالایی (y کوچک‌تر) = اولویت بالاتر
      const normalizedY = piece.ty / canvasHeight;

      // تعیین phase برای هر قطعه
      let phase = 3; // پیش‌فرض: مرحله 3
      if (normalizedY < 0.3) {
        phase = 2; // 30% بالایی = مرحله 2
      }

      // افزودن تصادفی‌سازی به phase
      if (Math.random() < 0.2) {
        phase = Math.random() > 0.5 ? phase - 1 : phase + 1;
        phase = Math.max(2, Math.min(3, phase)); // محدود به 2-3
      }

      (body as any)._windPhase = phase;
      (body as any)._windDirection = windDirection;
      (body as any)._randomDelay = Math.random() * 0.3; // تأخیر تصادفی 0-0.3 ثانیه
      (body as any)._rotationIntensity = 0.3 + Math.random() * 0.7; // شدت چرخش

      body.pieceId = piece.id;
      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);

    // ذخیره اطلاعات برای رندرینگ و کنترل مراحل
    if (engine) {
      (engine as any)._transitionType = "WIND";
      (engine as any)._transitionStartTime = Date.now();
      (engine as any)._physicsEnabled = true;
      (engine as any)._windDirection = windDirection;
      (engine as any)._canvasWidth = canvasWidth;
      (engine as any)._canvasHeight = canvasHeight;
    }

    // 🎬 کنترل مراحل باد با استفاده از تایمر
    // این تابع در هر فریم اجرا می‌شود تا نیروهای باد را اعمال کند
    const applyWindForces = () => {
      const elapsed = (Date.now() - (engine as any)._transitionStartTime) / 1000; // در ثانیه
      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body: any) => {
        if (body.isStatic) return;

        const phase = body._windPhase || 3;
        const delay = body._randomDelay || 0;
        const adjustedTime = elapsed - delay;
        const direction = body._windDirection || 1;
        const rotationIntensity = body._rotationIntensity || 0.5;

        // 🌬️ مرحله 1: نسیم ملایم (0-1.5s) - لرزش آرام
        if (adjustedTime >= 0 && adjustedTime < 1.5) {
          const intensity = Math.sin(adjustedTime * Math.PI * 8) * 0.08;
          Matter.Body.applyForce(body, body.position, {
            x: direction * intensity * (0.5 + Math.random() * 0.5),
            y: Math.sin(adjustedTime * Math.PI * 10) * 0.02,
          });
        }

        // 🍃 مرحله 2: باد متوسط (1.5-3.5s) - قطعات بالایی می‌روند
        else if (adjustedTime >= 1.5 && adjustedTime < 3.5 && phase === 2) {
          const phaseProgress = (adjustedTime - 1.5) / 2.0; // 0 to 1
          const windStrength = 0.3 + phaseProgress * 0.4; // افزایش تدریجی

          // نیروی افقی (به سمت خارج از صفحه)
          Matter.Body.applyForce(body, body.position, {
            x: direction * windStrength * (0.8 + Math.random() * 0.4),
            y: -0.05 + Math.sin(adjustedTime * Math.PI * 3) * 0.1, // حرکت موجی
          });

          // چرخش تدریجی
          const angularForce = direction * 0.002 * rotationIntensity * phaseProgress;
          Matter.Body.setAngularVelocity(body, body.angularVelocity + angularForce);
        }

        // 💨 مرحله 3: باد شدید (3.5-5s) - جاروب کردن همه
        else if (adjustedTime >= 3.5 && adjustedTime < 5.0) {
          const phaseProgress = (adjustedTime - 3.5) / 1.5; // 0 to 1
          const windStrength = 0.8 + phaseProgress * 1.2; // شدت بسیار بالا

          // نیروی افقی قوی
          Matter.Body.applyForce(body, body.position, {
            x: direction * windStrength * (1.0 + Math.random() * 0.5),
            y: -0.02 + Math.sin(adjustedTime * Math.PI * 2) * 0.05,
          });

          // چرخش سریع
          const angularForce = direction * 0.004 * rotationIntensity * (1 + phaseProgress);
          Matter.Body.setAngularVelocity(body, body.angularVelocity + angularForce);
        }
      });
    };

    // ذخیره تابع برای استفاده در update loop
    (engine as any)._windForceApplier = applyWindForces;
  },
};
