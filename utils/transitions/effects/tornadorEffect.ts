import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const tornadoEffect: TransitionEffect = {
  type: TransitionType.TORNADO,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // 1. پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // حذف کف (Floor) -> گردباد اشیاء را به آسمان می‌برد

    // 2. تنظیم جاذبه معکوس (Anti-Gravity)
    // جاذبه منفی باعث می‌شود همه چیز به طور طبیعی به سمت بالا "سقوط" کند (مکش گردباد)
    engine.world.gravity.y = -1.5; // مکش قوی به بالا
    engine.world.gravity.x = 0;

    const centerX = canvasWidth / 2;
    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.4,
          friction: 0.05,
          frictionAir: 0.03, // مقاومت هوا برای جلوگیری از سرعت بی‌نهایت
          density: 0.001,

          // تنظیمات تصویر
          render: {
            sprite: {
              texture: (piece as any).img || (piece as any).imageSrc,
              xScale: 1,
              yScale: 1,
            },
          },

          // عدم برخورد: بسیار مهم!
          // در گردباد قطعات خیلی نزدیک به هم حرکت می‌کنند.
          // اگر برخورد داشته باشند، به جای چرخش زیبا، به اطراف پرت می‌شوند.
          collisionFilter: {
            group: -1,
          },
        }
      );

      // فاصله از محور مرکزی گردباد
      const dx = centerX - body.position.x;

      // 3. شبیه‌سازی حرکت گردابی (Vortex Simulation)
      // ترفند: به جای چرخاندن واقعی (که در 2D سخت دیده می‌شود)،
      // ما قطعات را به سمت خط مرکزی (Center Line) هل می‌دهیم.
      // ترکیب "جاذبه منفی" (بالا) و "نیروی فنری به مرکز" (چپ/راست) باعث ایجاد موج سینوسی می‌شود.

      const forceToCenter = dx * 0.002; // هرچه دورتر باشد، محکم‌تر به مرکز کشیده می‌شود (قانون فنر)

      // اضافه کردن کمی آشوب (Chaos) که گردباد خیلی تمیز و مصنوعی نباشد
      const randomChaos = (Math.random() - 0.5) * 0.05;

      // اعمال سرعت اولیه
      Matter.Body.setVelocity(body, {
        x: forceToCenter * 50 + (Math.random() - 0.5) * 5, // سرعت افقی به سمت مرکز
        y: -5 - Math.random() * 10, // سرعت اولیه زیاد به سمت بالا (شلیک شدن)
      });

      // اعمال نیروی مداوم (اختیاری - اما اینجا با سرعت اولیه کار را جمع کردیم)
      // اما برای چرخش دور خود قطعه:
      Matter.Body.setAngularVelocity(body, forceToCenter * 10 + (Math.random() - 0.5));

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
