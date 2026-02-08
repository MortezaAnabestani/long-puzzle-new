import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const gravityEffect: TransitionEffect = {
  type: TransitionType.GRAVITY,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    // بررسی‌های اولیه
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // 1. پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // تغییر مهم: حذف Floor (زمین)
    // برای ترنزیشن، ما می‌خواهیم قطعات از پایین صفحه خارج شوند تا صفحه خالی شود.

    // 2. تنظیم جاذبه متعادل
    // عدد 1.0 استاندارد زمین است. زیاد کردن بیش از حد آن حرکت را زشت می‌کند.
    engine.world.gravity.y = 1.0;
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
          restitution: 0.4, // جهندگی کمتر نسبت به انفجار (سنگین‌تر)
          friction: 0.05, // اصطکاک کمتر برای لیز خوردن راحت‌تر
          frictionAir: 0.02, // مقاومت هوای کم برای سقوط روان
          density: 0.002,

          // تنظیمات تصویر (الزامی برای ظاهر درست)
          render: {
            sprite: {
              texture: (piece as any).img || (piece as any).imageSrc,
              xScale: 1,
              yScale: 1,
            },
          },

          // تغییر مهم: عدم برخورد قطعات با یکدیگر
          // این باعث می‌شود قطعات مثل "شره کردن رنگ" یا "ریزش شن" نرم پایین بریزند
          // و به هم گیر نکنند.
          collisionFilter: {
            group: -1,
          },
        }
      );

      // 3. محاسبه انحراف (Drift)
      // قطعاتی که سمت چپ هستند کمی به چپ و قطعات راست کمی به راست می‌روند.
      // این باعث می‌شود وسط صفحه زودتر خالی شود و دید کاربر باز شود.
      const distanceFromCenter = body.position.x - centerX;
      const driftFactor = (distanceFromCenter / canvasWidth) * 2; // عددی بین -1 تا 1

      // 4. اعمال سرعت اولیه
      Matter.Body.setVelocity(body, {
        x: driftFactor * (1 + Math.random()), // انحراف افقی ملایم
        y: Math.random() * -3, // یک "پرش" کوچک اولیه به بالا قبل از سقوط (برای حس جدا شدن)
      });

      // 5. چرخش ملایم
      // چرخش بر اساس جهت حرکت (قطعات سمت راست ساعتگرد، چپ پادساعتگرد)
      const rotationDirection = Math.sign(driftFactor) || 1;
      Matter.Body.setAngularVelocity(body, rotationDirection * (Math.random() * 0.1));

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
