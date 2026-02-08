import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const scatterEffect: TransitionEffect = {
  type: TransitionType.SCATTER,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // 1. پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // حذف کف (Floor) برای خروج قطعات از صفحه

    // 2. حذف جاذبه (Zero Gravity)
    // در افکت Scatter، قطعات باید مثل فضانوردان در فضا معلق شوند و به سویی که پرتاب شدند بروند.
    // اگر جاذبه باشد، قوس برمی‌دارند و حس "پراکندگی" از بین می‌رود.
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.8, // جهندگی بالا (برای برخوردهای احتمالی با دیواره‌های نامرئی اگر داشتید)
          friction: 0, // اصطکاک صفر برای حفظ سرعت
          frictionAir: 0.01, // مقاومت هوای بسیار کم (تا قطعات وسط راه نایستند و خارج شوند)
          density: 0.001,

          // تنظیمات تصویر
          render: {
            sprite: {
              texture: (piece as any).img || (piece as any).imageSrc,
              xScale: 1,
              yScale: 1,
            },
          },

          // جلوگیری از برخورد
          // در حالت Scatter، اگر قطعات به هم بخورند، مسیرشان عوض می‌شود و ممکن است در صفحه بمانند.
          // با group: -1 آن‌ها مثل ارواح از هم رد می‌شوند و سریع خارج می‌شوند.
          collisionFilter: {
            group: -1,
          },
        }
      );

      // 3. محاسبه جهت و سرعت تصادفی (Pure Chaos)
      const angle = Math.random() * Math.PI * 2; // زاویه کاملاً تصادفی (۰ تا ۳۶۰ درجه)

      // سرعت بالا برای تضمین خروج از صفحه
      // استفاده از setVelocity به جای applyForce برای کنترل دقیق‌تر سرعت نهایی
      const speed = 10 + Math.random() * 15; // سرعتی بین ۱۰ تا ۲۵ واحد (بسیار سریع)

      Matter.Body.setVelocity(body, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      });

      // 4. چرخش دیوانه‌وار (High Spin)
      // پراکندگی بدون چرخش سریع، حس مصنوعی بودن می‌دهد.
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 1.0); // چرخش خیلی سریع

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
