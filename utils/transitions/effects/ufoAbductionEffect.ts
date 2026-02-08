import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

/**
 * 🛸 UFO ABDUCTION EFFECT - Alien Beam Transition
 *
 * از مرکز بالای صفحه یک "پرتو" نامرئی قطعات را به بالا می‌کشد
 * قطعات نزدیک‌تر به مرکز زودتر کشیده می‌شوند
 * حس یک نیروی مکنده قدرتمند (مثل جاروبرقی فضایی)
 */
export const ufoAbductionEffect: TransitionEffect = {
  type: TransitionType.MAGNET,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // جاذبه منفی متوسط (مکش اصلی از velocity می‌آید)
    engine.world.gravity.y = -0.5;
    engine.world.gravity.x = 0;

    // مرکز پرتو (بالای صفحه)
    const beamCenterX = canvasWidth / 2;
    const beamCenterY = -50; // بالاتر از صفحه
    const beamRadius = canvasWidth * 0.4; // شعاع تأثیر پرتو

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.1,
          friction: 0.05,
          frictionAir: 0.03, // مقاومت هوا برای حرکت روان
          density: 0.001,

          render: {
            sprite: {
              texture: (piece as any).img || (piece as any).imageSrc,
              xScale: 1,
              yScale: 1,
            },
          },

          // عدم برخورد
          collisionFilter: {
            group: -1,
          },
        }
      );

      // محاسبه فاصله از مرکز پرتو
      const dx = beamCenterX - body.position.x;
      const dy = beamCenterY - body.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // بردار نرمال شده به سمت مرکز پرتو
      const normalX = dx / distance;
      const normalY = dy / distance;

      // قدرت مکش بر اساس فاصله افقی از مرکز
      const horizontalDist = Math.abs(body.position.x - beamCenterX);
      const isInBeam = horizontalDist < beamRadius;

      // محاسبه قدرت جذب (قطعات نزدیک‌تر قوی‌تر کشیده می‌شوند)
      let pullStrength = 0;
      if (isInBeam) {
        // فرمول جذب: قوی‌تر در مرکز، ضعیف‌تر در لبه‌ها
        pullStrength = (1 - horizontalDist / beamRadius) * 25;
      } else {
        // قطعات خارج از پرتو، با تأخیر کشیده می‌شوند
        pullStrength = 5;
      }

      // اضافه کردن حرکت مارپیچی جزئی (برای زیبایی)
      const spiralStrength = isInBeam ? 2 : 0;
      const tangentX = -normalY;

      // سرعت نهایی
      const baseSpeed = pullStrength + Math.random() * 5;

      Matter.Body.setVelocity(body, {
        x: normalX * baseSpeed + tangentX * spiralStrength,
        y: normalY * baseSpeed - 8, // مکش قوی به بالا
      });

      // چرخش ملایم
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);

      // ذخیره اطلاعات برای رندرینگ
      (body as any)._beamData = {
        isInBeam: isInBeam,
        distanceFromCenter: horizontalDist,
        pullStrength: pullStrength,
      };
      body.pieceId = piece.id;

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);

    // ذخیره اطلاعات پرتو برای رندرینگ
    if (engine) {
      (engine as any)._transitionType = "UFO_ABDUCTION";
      (engine as any)._transitionStartTime = Date.now();
      (engine as any)._physicsEnabled = true;
      (engine as any)._beamCenter = { x: beamCenterX, y: beamCenterY };
      (engine as any)._beamRadius = beamRadius;
    }
  },
};
