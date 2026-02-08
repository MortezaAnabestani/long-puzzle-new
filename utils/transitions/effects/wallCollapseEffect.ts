import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

/**
 * 🧱 WALL COLLAPSE EFFECT - 3D Falling Wall Transition
 *
 * پازل مثل یک دیوار به عقب می‌افتد (محور Z)
 * با استفاده از perspective transformation برای ایجاد حس سه‌بعدی
 * قطعات پایینی زودتر می‌افتند (گرانش واقعی)
 */
export const wallCollapseEffect: TransitionEffect = {
  type: TransitionType.COLLAPSE,
  duration: 3500,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // پاکسازی دنیا
    Matter.World.clear(engine.world, false);

    // جاذبه قوی (دیوار در حال سقوط)
    engine.world.gravity.y = 2.0;
    engine.world.gravity.x = 0;

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.3,
          friction: 0.5,
          frictionAir: 0.02,
          density: 0.002,

          render: {
            sprite: {
              texture: (piece as any).img || (piece as any).imageSrc,
              xScale: 1,
              yScale: 1,
            },
          },

          // قطعات می‌توانند با هم برخورد کنند
          collisionFilter: {
            group: 0,
          },
        }
      );

      // قطعات پایینی سریع‌تر شروع به سقوط می‌کنند
      const normalizedY = piece.ty / canvasHeight; // 0 (بالا) تا 1 (پایین)

      // سرعت سقوط بر اساس ارتفاع
      const fallSpeed = normalizedY * 8; // قطعات پایینی سریع‌تر

      // کمی حرکت به عقب (شبیه‌سازی محور Z)
      const backwardSpeed = (1 - normalizedY) * 3;

      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * backwardSpeed, // کمی پراکندگی افقی
        y: fallSpeed + Math.random() * 3,
      });

      // چرخش (قطعات بالایی بیشتر می‌چرخند)
      const rotationForce = (1 - normalizedY) * 0.15;
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * rotationForce);

      // ذخیره اطلاعات برای رندرینگ سه‌بعدی
      (body as any)._pieceData = {
        originalY: piece.ty,
        normalizedY: normalizedY,
        zDepth: 0, // شروع در صفحه Z=0
      };
      body.pieceId = piece.id;

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);

    // ذخیره اطلاعات
    if (engine) {
      (engine as any)._transitionType = "WALL_COLLAPSE";
      (engine as any)._transitionStartTime = Date.now();
      (engine as any)._physicsEnabled = true;
      (engine as any)._canvasHeight = canvasHeight;
    }
  },
};
