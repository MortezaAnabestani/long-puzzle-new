import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

/**
 * 💥 WRECKING BALL EFFECT - Demolition Transition
 *
 * یک توپ سنگین از یک طرف می‌آید و به پازل برخورد می‌کند
 * قطعات به صورت واقع‌گرایانه پرتاب و پراکنده می‌شوند
 */
export const wreckingBallEffect: TransitionEffect = {
  type: TransitionType.EXPLOSION,
  duration: 4500,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // جاذبه طبیعی
    engine.world.gravity.y = 1.2;
    engine.world.gravity.x = 0;

    const bodies: any[] = [];

    // ساخت قطعات پازل
    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.6, // جهش خوب پس از برخورد
          friction: 0.3,
          frictionAir: 0.01,
          density: 0.001,

          render: {
            sprite: {
              texture: (piece as any).img || (piece as any).imageSrc,
              xScale: 1,
              yScale: 1,
            },
          },

          // قطعات با هم برخورد کنند (برای واقع‌گرایی)
          collisionFilter: {
            category: 0x0002,
            mask: 0x0001 | 0x0002, // با توپ و با همدیگر برخورد کنند
          },
        }
      );

      bodies.push(body);
    });

    // تعیین تصادفی جهت ورود توپ
    const directions = [
      { x: -100, vx: 35, vy: -5, name: "LEFT" }, // از چپ
      { x: canvasWidth + 100, vx: -35, vy: -5, name: "RIGHT" }, // از راست
      { x: canvasWidth / 2, y: -100, vx: 0, vy: 25, name: "TOP" }, // از بالا
    ];

    const direction = directions[Math.floor(Math.random() * directions.length)];

    // اندازه توپ (نسبت به سایز canvas)
    const ballRadius = Math.min(canvasWidth, canvasHeight) * 0.08; // 8% از ابعاد

    // موقعیت شروع توپ
    const ballX = direction.x ?? (direction.name === "TOP" ? canvasWidth / 2 : 0);
    const ballY = direction.y ?? canvasHeight / 2;

    // ساخت توپ ویرانگر
    const wreckingBall = Matter.Bodies.circle(ballX, ballY, ballRadius, {
      restitution: 0.7,
      friction: 0.1,
      frictionAir: 0.005,
      density: 0.05, // بسیار سنگین (50 برابر قطعات)

      render: {
        fillStyle: "#2C3E50",
        strokeStyle: "#34495E",
        lineWidth: 3,
      },

      collisionFilter: {
        category: 0x0001,
        mask: 0x0002, // فقط با قطعات برخورد کند
      },
    });

    // اعمال سرعت اولیه به توپ
    Matter.Body.setVelocity(wreckingBall, {
      x: direction.vx,
      y: direction.vy,
    });

    // چرخش توپ
    Matter.Body.setAngularVelocity(wreckingBall, (Math.random() - 0.5) * 0.3);

    bodies.push(wreckingBall);

    Matter.World.add(engine.world, bodies);

    // ذخیره اطلاعات
    if (engine) {
      (engine as any)._transitionType = "WRECKING_BALL";
      (engine as any)._transitionStartTime = Date.now();
      (engine as any)._physicsEnabled = true;
      (engine as any)._wreckingBall = wreckingBall; // برای رندر کردن توپ
      (engine as any)._wreckingBallRadius = ballRadius;
    }
  },
};
