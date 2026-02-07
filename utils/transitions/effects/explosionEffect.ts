import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const explosionEffect: TransitionEffect = {
  type: TransitionType.EXPLOSION,
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
          restitution: 0.6,
          friction: 0.1,
          density: 0.0015,
        }
      );

      // Calculate vector away from center
      const dx = body.position.x - centerX;
      const dy = body.position.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Apply explosive force outward
      Matter.Body.applyForce(body, body.position, {
        x: (dx / distance) * 0.3 * (0.8 + Math.random() * 0.4),
        y: (dy / distance) * 0.2 * (0.8 + Math.random() * 0.4),
      });

      // Add random spin
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
