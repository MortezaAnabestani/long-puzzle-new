import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const gravityEffect: TransitionEffect = {
  type: TransitionType.GRAVITY,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    const floorY = canvasHeight + 50;
    const floor = Matter.Bodies.rectangle(canvasWidth / 2, floorY, canvasWidth * 3, 100, { isStatic: true });
    Matter.World.add(engine.world, [floor]);

    engine.world.gravity.y = 2.0; // Strong gravity

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.5,
          friction: 0.1,
          density: 0.002,
        }
      );

      // Random initial horizontal velocity
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 3,
        y: Math.random() * -2, // slight upward kick
      });

      // Random rotation
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
