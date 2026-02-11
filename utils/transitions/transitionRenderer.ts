import { TransitionEffect, TransitionType, PuzzlePiece } from "./transitionTypes";

/**
 * 🧹 REALISTIC SWEEP EFFECT - افکت جاروزدن واقعی
 *
 * ✅ شبیه‌سازی کامل فیزیک جاروزدن واقعی
 * ✅ ضربه اولیه قوی + نیروی مداوم
 * ✅ برخورد قطعات با یکدیگر (توده‌سازی)
 * ✅ اصطکاک و لغزش واقعی روی زمین
 * ✅ خروج کامل همه قطعات از محیط
 */
export const sweepEffect: TransitionEffect = {
  type: TransitionType.SWEEP,
  duration: 5000, // ۵ ثانیه - زمان واقعی جاروزدن

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    // 🎲 انتخاب گوشه شروع (4 حالت ممکن)
    const startCornerIndex = Math.floor(Math.random() * 4);

    let startX = 0,
      startY = 0;
    let exitX = 0,
      exitY = 0; // نقطه خروج (گوشه مخالف)
    let forceDirX = 1,
      forceDirY = 1;

    switch (startCornerIndex) {
      case 0: // بالا-چپ → پایین-راست
        startX = 0;
        startY = 0;
        exitX = canvasWidth;
        exitY = canvasHeight;
        forceDirX = 1;
        forceDirY = 1;
        break;
      case 1: // بالا-راست → پایین-چپ
        startX = canvasWidth;
        startY = 0;
        exitX = 0;
        exitY = canvasHeight;
        forceDirX = -1;
        forceDirY = 1;
        break;
      case 2: // پایین-راست → بالا-چپ
        startX = canvasWidth;
        startY = canvasHeight;
        exitX = 0;
        exitY = 0;
        forceDirX = -1;
        forceDirY = -1;
        break;
      case 3: // پایین-چپ → بالا-راست
        startX = 0;
        startY = canvasHeight;
        exitX = canvasWidth;
        exitY = 0;
        forceDirX = 1;
        forceDirY = -1;
        break;
    }

    console.log(
      `🧹 REALISTIC SWEEP: Starting from corner ${startCornerIndex} → Exit at (${exitX}, ${exitY})`,
    );

    // 🌍 جاذبه صفر - نمای از بالا (قطعات روی زمین هستند)
    engine.world.gravity.x = 0;
    engine.world.gravity.y = 0;

    const bodies: any[] = [];
    const maxDistance = Math.hypot(canvasWidth, canvasHeight);

    pieces.forEach((piece) => {
      const cx = piece.tx + piece.pw / 2;
      const cy = piece.ty + piece.ph / 2;

      // فاصله از نقطه شروع جارو
      const distFromStart = Math.hypot(cx - startX, cy - startY);

      // 🍃 تنظیمات فیزیک واقعی برگ/آشغال روی زمین
      const body = Matter.Bodies.rectangle(cx, cy, piece.pw, piece.ph, {
        // جهش تقریباً صفر (برگ روی زمین نمی‌جهد)
        restitution: 0.05,

        // اصطکاک بالا - برگ‌ها روی زمین می‌لغزند ولی سریع متوقف می‌شوند
        friction: 0.8,

        // مقاومت هوا متوسط - برگ‌ها سبک هستند
        frictionAir: 0.02,

        // چگالی پایین - برگ‌ها سبک هستند (ولی نه خیلی کم که پرواز کنند)
        density: 0.001,

        // زاویه اولیه تصادفی
        angle: Math.random() * Math.PI * 2,

        // 🔴 کلید اصلی: فعال کردن برخورد!
        // برگ‌ها باید به هم بخورند و توده‌های کوچک بسازند
        collisionFilter: {
          group: 0, // همه در یک گروه
          category: 1, // دسته یکسان
          mask: 1, // با همدیگر برخورد می‌کنند
        },
      });

      // متادیتا برای هر قطعه
      (body as any)._distFromStart = distFromStart;
      (body as any)._randomSeed = Math.random(); // برای تنوع
      (body as any)._hasBeenHit = false; // آیا جارو به این قطعه خورده؟
      (body as any)._rotationDir = Math.random() > 0.5 ? 1 : -1;

      body.pieceId = piece.id;
      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);

    // ذخیره پارامترها برای استفاده در لوپ
    (engine as any)._transitionType = "SWEEP";
    (engine as any)._transitionStartTime = Date.now();
    (engine as any)._physicsEnabled = true;

    (engine as any)._sweepParams = {
      startX,
      startY,
      exitX,
      exitY,
      forceDirX,
      forceDirY,
      maxDistance,
      duration: 5000,
      // سرعت حرکت جارو (پیکسل در میلی‌ثانیه)
      sweepSpeed: (maxDistance * 1.8) / 5000, // 1.8x فاصله در 5 ثانیه
    };

    // 🧹 تابع اصلی: شبیه‌سازی جاروزدن واقعی
    const applySweepForces = () => {
      const now = Date.now();
      const elapsed = now - (engine as any)._transitionStartTime;
      const params = (engine as any)._sweepParams;

      // موقعیت فعلی "جارو" (یک خط فرضی که از گوشه شروع می‌شود)
      const currentSweepDistance = elapsed * params.sweepSpeed;

      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body: any) => {
        if (body.isStatic) return;

        const dist = body._distFromStart;
        const seed = body._randomSeed;

        // 🎯 آیا جارو به این قطعه رسیده؟
        const sweepReachedThisPiece = currentSweepDistance >= dist - 80;

        if (sweepReachedThisPiece) {
          // اولین بار که جارو می‌خورد - ضربه اولیه قوی
          if (!body._hasBeenHit) {
            body._hasBeenHit = true;
            body._hitTime = elapsed;

            // 💥 ضربه اولیه جارو - نیرو خیلی قوی‌تر از قبل
            const initialImpulse = 0.015 + seed * 0.01; // 15-25 برابر قبلی!

            // کمی پراکندگی تصادفی (برگ‌ها دقیقاً راست نمی‌روند)
            const scatter = (Math.random() - 0.5) * 0.3;

            Matter.Body.applyForce(body, body.position, {
              x: params.forceDirX * initialImpulse + scatter * Math.abs(params.forceDirY),
              y: params.forceDirY * initialImpulse + scatter * Math.abs(params.forceDirX),
            });

            // چرخش اولیه تند
            const spinImpulse = (Math.random() - 0.5) * 0.15;
            Matter.Body.setAngularVelocity(body, spinImpulse);
          }

          // 🌊 نیروی مداوم جارو (فشار ثابت تا خارج شوند)
          const timeSinceHit = elapsed - (body._hitTime || 0);

          // نیرو کم‌کم کاهش می‌یابد ولی هیچوقت صفر نمی‌شود
          const continuousForce = 0.002 * Math.exp(-timeSinceHit / 1500);

          // اضافه کردن turbulence (تلاطم طبیعی)
          const turbulence = Math.sin(elapsed * 0.003 + seed * 20) * 0.0005;

          Matter.Body.applyForce(body, body.position, {
            x: params.forceDirX * (continuousForce + Math.abs(turbulence)),
            y: params.forceDirY * (continuousForce + turbulence),
          });

          // چرخش مداوم کمتر
          const continuousSpin = 0.0003 * body._rotationDir * Math.sin(elapsed * 0.002);
          Matter.Body.setAngularVelocity(body, body.angularVelocity * 0.98 + continuousSpin);

          // 🚀 فشار اضافی برای قطعاتی که نزدیک خروجی هستند
          const distToExit = Math.hypot(body.position.x - params.exitX, body.position.y - params.exitY);

          if (distToExit < 300 && timeSinceHit > 1000) {
            // فشار قوی برای اطمینان از خروج
            const exitBoost = 0.003;
            Matter.Body.applyForce(body, body.position, {
              x: params.forceDirX * exitBoost,
              y: params.forceDirY * exitBoost,
            });
          }
        }
      });
    };

    (engine as any)._sweepForceApplier = applySweepForces;
  },
};
