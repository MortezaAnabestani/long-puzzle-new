import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const collapseEffect: TransitionEffect = {
  type: TransitionType.COLLAPSE,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    const floorY = canvasHeight + 50;
    const floor = Matter.Bodies.rectangle(canvasWidth / 2, floorY, canvasWidth * 3, 100, { isStatic: true });
    Matter.World.add(engine.world, [floor]);

    engine.world.gravity.y = 1.2;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.4,
          friction: 0.15,
          density: 0.002,
        }
      );

      // Calculate vector towards center
      const dx = centerX - body.position.x;
      const dy = centerY - body.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Apply strong inward force
      Matter.Body.applyForce(body, body.position, {
        x: (dx / distance) * 0.25,
        y: (dy / distance) * 0.15,
      });

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
