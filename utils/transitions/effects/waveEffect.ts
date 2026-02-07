import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const waveEffect: TransitionEffect = {
  type: TransitionType.WAVE,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    const floorY = canvasHeight + 50;
    const floor = Matter.Bodies.rectangle(canvasWidth / 2, floorY, canvasWidth * 3, 100, { isStatic: true });
    Matter.World.add(engine.world, [floor]);

    engine.world.gravity.y = 1.3;

    const leftToRight = Math.random() > 0.5;
    const bodies: any[] = [];

    // Sort pieces by x position for wave effect
    const sortedPieces = [...pieces].sort((a, b) => (leftToRight ? a.tx - b.tx : b.tx - a.tx));

    sortedPieces.forEach((piece, index) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.4,
          friction: 0.15,
          density: 0.0015,
        }
      );

      // Delay factor based on position in wave
      const delay = index / sortedPieces.length;
      const horizontalForce = leftToRight ? 0.2 : -0.2;

      // Apply force with wave timing
      setTimeout(() => {
        if (body && engine.world) {
          Matter.Body.applyForce(body, body.position, {
            x: horizontalForce * (0.8 + Math.random() * 0.4),
            y: -0.15 - Math.random() * 0.1, // upward kick
          });
        }
      }, delay * 1000);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
