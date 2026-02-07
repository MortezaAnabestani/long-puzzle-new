import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const scatterEffect: TransitionEffect = {
  type: TransitionType.SCATTER,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    const floorY = canvasHeight + 50;
    const floor = Matter.Bodies.rectangle(canvasWidth / 2, floorY, canvasWidth * 3, 100, { isStatic: true });
    Matter.World.add(engine.world, [floor]);

    engine.world.gravity.y = 1.5;

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.6,
          friction: 0.1,
          density: 0.0018,
        }
      );

      // Completely random force direction and magnitude
      const angle = Math.random() * Math.PI * 2;
      const forceMagnitude = 0.15 + Math.random() * 0.25;

      Matter.Body.applyForce(body, body.position, {
        x: Math.cos(angle) * forceMagnitude,
        y: Math.sin(angle) * forceMagnitude - 0.1, // slight upward bias
      });

      // Random chaotic rotation
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.6);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
