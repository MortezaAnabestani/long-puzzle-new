import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const magnetEffect: TransitionEffect = {
  type: TransitionType.MAGNET,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    Matter.World.clear(engine.world, false);

    const floorY = canvasHeight + 50;
    const floor = Matter.Bodies.rectangle(canvasWidth / 2, floorY, canvasWidth * 3, 100, { isStatic: true });
    Matter.World.add(engine.world, [floor]);

    engine.world.gravity.y = 1.0;

    // Create 3-5 random magnetic points
    const numMagnets = 3 + Math.floor(Math.random() * 3);
    const magnets: { x: number; y: number }[] = [];

    for (let i = 0; i < numMagnets; i++) {
      magnets.push({
        x: canvasWidth * (0.2 + Math.random() * 0.6),
        y: canvasHeight * (0.2 + Math.random() * 0.4),
      });
    }

    const bodies: any[] = [];

    pieces.forEach((piece) => {
      const body = Matter.Bodies.rectangle(
        piece.tx + piece.pw / 2,
        piece.ty + piece.ph / 2,
        piece.pw,
        piece.ph,
        {
          restitution: 0.3,
          friction: 0.2,
          density: 0.0012,
        }
      );

      // Find nearest magnet
      let nearestMagnet = magnets[0];
      let minDist = Infinity;

      magnets.forEach((magnet) => {
        const dx = magnet.x - body.position.x;
        const dy = magnet.y - body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestMagnet = magnet;
        }
      });

      // Apply magnetic force
      const dx = nearestMagnet.x - body.position.x;
      const dy = nearestMagnet.y - body.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      Matter.Body.applyForce(body, body.position, {
        x: (dx / distance) * 0.2,
        y: (dy / distance) * 0.15,
      });

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
