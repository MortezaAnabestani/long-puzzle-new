import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

/**
 * 🍂 LEAF SWEEP EFFECT - افکت جاروزدن برگ‌ها
 *
 * ✅ شروع از یک گوشه تصادفی به سمت مخالف
 * ✅ فیزیک شبیه به برگ (سبک، چرخان، با اصطکاک هوا)
 * ✅ حرکت تدریجی و طبیعی طی ۵ ثانیه
 * ✅ حفظ کامل ابعاد قطعات
 */
export const sweepEffect: TransitionEffect = {
  type: TransitionType.SWEEP,
  duration: 600, // ۵ ثانیه دقیق

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    // 🎲 تنظیمات جارو (انتخاب گوشه)
    // 0: بالا-چپ | 1: بالا-راست | 2: پایین-راست | 3: پایین-چپ
    const startCornerIndex = Math.floor(Math.random() * 4);

    // تعیین مختصات شروع جارو
    let startX = 0;
    let startY = 0;
    // تعیین جهت کلی نیرو (به سمت گوشه مخالف)
    let forceDirX = 1;
    let forceDirY = 1;

    switch (startCornerIndex) {
      case 0: // Top-Left -> Bottom-Right
        startX = 0;
        startY = 0;
        forceDirX = 1;
        forceDirY = 1;
        break;
      case 1: // Top-Right -> Bottom-Left
        startX = canvasWidth;
        startY = 0;
        forceDirX = -1;
        forceDirY = 1;
        break;
      case 2: // Bottom-Right -> Top-Left
        startX = canvasWidth;
        startY = canvasHeight;
        forceDirX = -1;
        forceDirY = -1;
        break;
      case 3: // Bottom-Left -> Top-Right
        startX = 0;
        startY = canvasHeight;
        forceDirX = 1;
        forceDirY = -1;
        break;
    }

    console.log(`🍂 Leaf Sweep starting from corner index: ${startCornerIndex}`);

    // جاذبه صفر (نمای از بالا - قطعات روی زمین هستند)
    // باد جارو آن‌ها را حرکت می‌دهد، نه جاذبه
    engine.world.gravity.x = 0;
    engine.world.gravity.y = 0;

    const bodies: any[] = [];
    // حداکثر فاصله قطری برای محاسبه زمان‌بندی موج
    const maxDistance = Math.hypot(canvasWidth, canvasHeight);

    pieces.forEach((piece) => {
      // محاسبه مرکز قطعه
      const cx = piece.tx + piece.pw / 2;
      const cy = piece.ty + piece.ph / 2;

      // فاصله این قطعه از گوشه شروع
      const distFromStart = Math.hypot(cx - startX, cy - startY);

      // 🍂 تنظیمات فیزیکی "برگ"
      const body = Matter.Bodies.rectangle(cx, cy, piece.pw, piece.ph, {
        // ۱. جهش (Restitution):
        // برگ‌ها اصلاً نمی‌جهند. مقدار ۰.۱ باعث می‌شود وقتی به زمین یا هم می‌خورند، انرژی‌شان تلف شود.
        restitution: 0.1,

        // ۲. اصطکاک سطحی (Friction):
        // افزایش به ۰.۴ برای اینکه روی زمین کمی "گیر" کنند و شبیه حرکت روی یخ نباشد.
        friction: 0.6,

        // ۳. مقاومت هوا (FrictionAir) - کلید طبیعی شدن:
        // به جای یک عدد ثابت، برای هر قطعه یک عدد تصادفی بین ۰.۰۴ تا ۰.۱۲ در نظر می‌گیریم.
        // این باعث می‌شود بعضی قطعات سریع‌تر جلو بروند و بعضی در هوا معلق بمانند.
        frictionAir: 0.04 + Math.random() * 0.08,

        // ۴. چگالی (Density):
        // کاهش شدید چگالی (0.0004). برگ‌ها باید جرم بسیار کمی داشته باشند تا با کوچکترین نیرو شتاب بگیرند.
        density: 0.0006,

        // ۵. زاویه اولیه (Angle):
        // قرار دادن زاویه روی ۰ غیرطبیعی است. با Math.random زاویه اولیه را نامنظم می‌کنیم.
        angle: 0,

        // ۶. اینرسی دورانی (Inertia):
        // با ضرب کردن اینرسی در یک ضریب تصادفی، تعیین می‌کنیم که هر برگ چقدر راحت دور خودش بچرخد.
        inertia: 1.2, // (اختیاری) اگر می‌خواهید چرخش کاملاً توسط کد شما کنترل شود

        // ۷. فیلتر برخورد:
        // برای اینکه قطعات مثل یک "توده" واقعی روی هم سوار شوند (اگر نیاز دارید)،
        // اما برای پرفورمنس بالا در جارو زدن، همان تنظیم شما (عدم برخورد) عالیست.
        collisionFilter: { group: -1, category: 0, mask: 0 },
      });

      // ذخیره متادیتای اختصاصی برای انیمیشن
      (body as any)._distFromStart = distFromStart;
      (body as any)._randomOffset = Math.random(); // برای ایجاد تفاوت بین قطعات
      (body as any)._rotationDir = Math.random() > 0.5 ? 1 : -1;

      body.pieceId = piece.id;
      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);

    // ذخیره وضعیت در انجین برای دسترسی در لوپ آپدیت
    (engine as any)._transitionType = "SWEEP";
    (engine as any)._transitionStartTime = Date.now();
    (engine as any)._physicsEnabled = true;

    // پارامترهای سراسری افکت
    (engine as any)._sweepParams = {
      startX,
      startY,
      forceDirX,
      forceDirY,
      maxDistance,
      duration: 5000,
    };

    // 🌊 تابع اعمال نیروی موجی
    const applySweepForces = () => {
      const now = Date.now();
      const elapsed = now - (engine as any)._transitionStartTime;
      const params = (engine as any)._sweepParams;

      // پیشرفت کلی زمان (0 تا 1)
      const progress = Math.min(elapsed / params.duration, 1);

      // "موقعیت جارو": یک خط فرضی که جلو می‌رود
      // کمی بیشتر از maxDistance می‌رویم تا مطمئن شویم همه خارج شدند
      const currentWaveDistance = progress * (params.maxDistance * 1.5);

      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body: any) => {
        if (body.isStatic) return;

        const dist = body._distFromStart;
        const randomVar = body._randomOffset; // عدد تصادفی بین 0-1

        // 🎯 منطق فعال‌سازی:
        // اگر موج جارو به موقعیت قطعه رسیده باشد
        if (currentWaveDistance > dist - 100) {
          // 100px زودتر شروع کن تا نرم باشد

          // شدت نیرو (با دور شدن زمان، نیرو کمتر ولی مداوم می‌شود تا قطعه خارج شود)
          // یک ضربه اولیه قوی (Impulse) و سپس باد مداوم

          const timeSinceHit = currentWaveDistance - dist;
          let forceMagnitude = 0;

          if (timeSinceHit > 0) {
            // نیروی اصلی: ترکیب یک فشار مداوم و آشفتگی
            // هرچه به انتهای زمان نزدیک می‌شویم، نیرو را حفظ می‌کنیم تا خارج شوند
            forceMagnitude = 0.0009;
          }

          // ایجاد "تلاطم" (Turbulence)
          // قطعات نباید صاف بروند، باید مثل برگ تلو تلو بخورند
          const noise = Math.sin(elapsed * 0.005 + randomVar * 10);

          // بردار جهت اصلی + کمی انحراف تصادفی
          const dirX = params.forceDirX + noise * 0.5;
          const dirY = params.forceDirY + noise * 0.5; // * 0.5 یعنی انحراف کمتر در محور Y

          // اعمال نیرو
          if (forceMagnitude > 0) {
            Matter.Body.applyForce(body, body.position, {
              x: dirX * forceMagnitude * (1 + randomVar), // سرعت‌های متفاوت
              y: dirY * forceMagnitude * (1 + randomVar),
            });

            // 🌀 چرخش (برگ‌ها وقتی هل داده می‌شوند می‌چرخند)
            const rotationForce = 0.0015 * body._rotationDir * (1 + Math.abs(noise));
            Matter.Body.setAngularVelocity(body, body.angularVelocity + rotationForce);
          }
        }
      });
    };

    (engine as any)._sweepForceApplier = applySweepForces;
  },
};
