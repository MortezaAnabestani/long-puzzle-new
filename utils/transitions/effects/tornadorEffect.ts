import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const tornadoEffect: TransitionEffect = {
  type: TransitionType.TORNADO,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    const floorY = canvasHeight + 50;
    const floor = Matter.Bodies.rectangle(canvasWidth / 2, floorY, canvasWidth * 3, 100, { isStatic: true });
    Matter.World.add(engine.world, [floor]);

    engine.world.gravity.y = 0.6; // Reduced gravity for tornado lift

    const centerX = canvasWidth / 2;
    const clockwise = Math.random() > 0.5;
    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.3,
          friction: 0.1,
          density: 0.0008,
        }
      );

      // Calculate distance from center vertical axis
      const dx = body.position.x - centerX;
      const dy = body.position.y;
      const radius = Math.abs(dx);

      // Tangential force for rotation
      const tangentialForce = clockwise ? 0.18 : -0.18;

      // Upward force stronger at center
      const upwardForce = -0.2 * (1 - radius / canvasWidth);

      Matter.Body.applyForce(body, body.position, {
        x: tangentialForce * (1 + Math.random() * 0.3),
        y: upwardForce + Math.random() * -0.05,
      });

      // Strong rotation
      Matter.Body.setAngularVelocity(body, clockwise ? 0.25 : -0.25);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
