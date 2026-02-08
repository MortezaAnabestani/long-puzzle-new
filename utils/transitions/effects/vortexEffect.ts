import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

/**
 * 🌪️ VORTEX EFFECT - Tornado/Whirlpool Transition
 *
 * قطعات به صورت مارپیچی به سمت بالا می‌چرخند و از صفحه خارج می‌شوند
 * ترکیبی از چرخش، مکش به بالا و پراکندگی تدریجی
 */
export const vortexEffect: TransitionEffect = {
  type: TransitionType.TORNADO,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // جاذبه منفی قوی (مکش به بالا)
    engine.world.gravity.y = -1.8;
    engine.world.gravity.x = 0;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const bodies: any[] = [];

    pieces.forEach((piece, index) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.2,
          friction: 0.01,
          frictionAir: 0.02,
          density: 0.001,

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
        }
      );

      // محاسبه فاصله از مرکز
      const dx = body.position.x - centerX;
      const dy = body.position.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // بردار نرمال‌شده
      const normalX = dx / distance;
      const normalY = dy / distance;

      // نیروی چرخشی (tangent perpendicular)
      const tangentX = -normalY;
      const tangentY = normalX;

      // ترکیب چرخش + مکش به مرکز (برای ایجاد مارپیچ)
      const spiralStrength = 0.6;
      const pullToCenter = 0.3;

      const baseSpeed = 8 + Math.random() * 6;

      // سرعت مارپیچی
      const vx = tangentX * spiralStrength * baseSpeed - normalX * pullToCenter * baseSpeed;
      const vy = tangentY * spiralStrength * baseSpeed - normalY * pullToCenter * baseSpeed;

      // افزودن مکش قوی به بالا
      Matter.Body.setVelocity(body, {
        x: vx,
        y: vy - (10 + Math.random() * 8), // مکش قوی به بالا
      });

      // چرخش سریع هر قطعه دور خودش
      const rotationSpeed = (Math.random() - 0.5) * 1.2;
      Matter.Body.setAngularVelocity(body, rotationSpeed);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);

    // ذخیره اطلاعات برای رندرینگ
    if (engine) {
      (engine as any)._transitionType = "VORTEX";
      (engine as any)._transitionStartTime = Date.now();
      (engine as any)._physicsEnabled = true;
    }
  },
};
