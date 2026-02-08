import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const magnetEffect: TransitionEffect = {
  type: TransitionType.MAGNET,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // 1. پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // حذف کف (Floor) و جاذبه
    // در افکت آهنربا، جاذبه مزاحم است. ما می‌خواهیم نیروی مغناطیسی تنها حاکم باشد.
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    // 2. تعریف نقاط مغناطیسی (Attractors)
    // بهتر است این نقاط کمی دور از مرکز باشند تا پازل "باز" شود.
    const numMagnets = 3; // تعداد ثابت برای کنترل بهتر
    const magnets: { x: number; y: number }[] = [];

    // ایجاد آهنرباها در گوشه‌ها یا اطراف صفحه (برای اینکه مرکز صفحه تمیز شود)
    magnets.push({ x: canvasWidth * 0.2, y: canvasHeight * 0.2 }); // بالا چپ
    magnets.push({ x: canvasWidth * 0.8, y: canvasHeight * 0.2 }); // بالا راست
    magnets.push({ x: canvasWidth * 0.5, y: canvasHeight * 0.8 }); // پایین وسط

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0, // بدون جهندگی (می‌خواهیم بچسبند)
          friction: 1, // اصطکاک بالا
          frictionAir: 0.1, // مقاومت هوای بسیار بالا (نکته کلیدی!)
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
          // این باعث می‌شود قطعات مثل براده‌های آهن روی هم تلمبار شوند
          collisionFilter: {
            group: -1,
          },
        }
      );

      // پیدا کردن نزدیک‌ترین آهنربا
      let nearestMagnet = magnets[0];
      let minDist = Infinity;

      magnets.forEach((magnet) => {
        const dx = magnet.x - body.position.x;
        const dy = magnet.y - body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestMagnet = magnet;
        }
      });

      // محاسبه بردار جهت به سمت آهنربا
      const dx = nearestMagnet.x - body.position.x;
      const dy = nearestMagnet.y - body.position.y;

      // اضافه کردن کمی "پراکندگی" (Jitter)
      // اگر همه دقیقاً به یک نقطه بروند، روی هم محو می‌شوند.
      // با این کار یک "ابر" دور آهنربا تشکیل می‌دهند.
      const jitterX = (Math.random() - 0.5) * 50;
      const jitterY = (Math.random() - 0.5) * 50;

      const targetX = dx + jitterX;
      const targetY = dy + jitterY;

      // 3. حرکت سریع و ترمز شدید (Snap Effect)
      // به جای applyForce، اینجا setVelocity بهتر کار می‌کند.
      // چون frictionAir را بالا بردیم (0.1)، قطعات با سرعت شلیک می‌شوند و
      // وقتی به نزدیکی آهنربا رسیدند، به دلیل اصطکاک هوا متوقف می‌شوند.
      // این حس "چسبیدن مغناطیسی" را عالی شبیه‌سازی می‌کند.

      const speed = 15 + Math.random() * 10; // سرعت متفاوت برای هر قطعه
      const angle = Math.atan2(targetY, targetX);

      Matter.Body.setVelocity(body, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      });

      // چرخش سریع هنگام جذب شدن
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.8);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
