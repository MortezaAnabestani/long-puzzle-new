import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const implosionEffect: TransitionEffect = {
  type: TransitionType.IMPLOSION,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // 1. پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // حذف کف (Floor) برای اینکه قطعات در فضایی بی‌پایان باشند

    // 2. جاذبه صفر (برای ایجاد خلاء فضایی)
    // جاذبه‌ی y=0.5 باعث می‌شود گرداب به سمت پایین کشیده شود که زشت است.
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.1, // جهندگی کم (نمی‌خواهیم زیاد کمانه کنند)
          friction: 0, // اصطکاک صفر برای سرعت بالا
          frictionAir: 0.03, // کمی مقاومت هوا برای اینکه حرکت بعد از مدتی آرام شود
          density: 0.005, // چگالی بالاتر برای اینکه نیروها اثر سنگین‌تری داشته باشند

          // تنظیمات رندر
          render: {
            sprite: {
              texture: (piece as any).img || (piece as any).imageSrc,
              xScale: 1,
              yScale: 1,
            },
          },

          // حیاتی: جلوگیری از برخورد قطعات
          // این باعث می‌شود قطعات در مرکز صفحه روی هم جمع شوند بدون اینکه همدیگر را دفع کنند
          collisionFilter: {
            group: -1,
          },
        }
      );

      // محاسبه فاصله و زاویه نسبت به مرکز
      const dx = centerX - body.position.x;
      const dy = centerY - body.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // بردار نرمال شده به سمت مرکز
      const normalX = dx / distance;
      const normalY = dy / distance;

      // 3. فرمول جادویی گرداب (Vortex)
      // ترکیب نیروی جذب (Pull) + نیروی چرخشی (Spin)
      const pullStrength = 0.8; // قدرت مکش به داخل
      const spinStrength = 0.5; // قدرت چرخش به دور مرکز

      // محاسبه نیروی نهایی
      // بخش اول: کشیدن به مرکز
      // بخش دوم: چرخش 90 درجه (برای ایجاد حالت گرداب) -> (-y, x)
      const forceX = normalX * pullStrength - normalY * spinStrength;
      const forceY = normalY * pullStrength + normalX * spinStrength;

      // اعمال نیرو با در نظر گرفتن جرم (برای حرکت یکنواخت همه قطعات)
      // استفاده از setVelocity برای حرکت قطعی‌تر نسبت به applyForce تک‌ضرب
      Matter.Body.setVelocity(body, {
        x: forceX * 15, // ضریب سرعت
        y: forceY * 15,
      });

      // چرخش وحشیانه خود قطعه به دور خودش
      Matter.Body.setAngularVelocity(body, (Math.random() > 0.5 ? 1 : -1) * 0.5);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
