import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const windEffect: TransitionEffect = {
  type: TransitionType.WIND,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (!engine || typeof window === "undefined") return;
    const Matter = (window as any).Matter;
    if (!Matter) return;

    // Clear existing world
    Matter.World.clear(engine.world, false);

    // Create floor at the bottom
    const floorY = canvasHeight + 50;
    const floor = Matter.Bodies.rectangle(canvasWidth / 2, floorY, canvasWidth * 3, 100, { isStatic: true });
    Matter.World.add(engine.world, [floor]);

    // Gentle wind direction (random left or right)
    const windFromRight = Math.random() > 0.5;
    const windForce = windFromRight ? -0.12 : 0.12; // Gentler force

    // Reduced gravity for smoother motion
    engine.world.gravity.y = 0.8;

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
          density: 0.001,
          angle: (Math.random() - 0.5) * 0.2,
        }
      );

      // Apply gentle wind force with slight vertical variation
      Matter.Body.applyForce(body, body.position, {
        x: windForce * (0.7 + Math.random() * 0.6),
        y: -0.03 * Math.random(), // slight upward variation
      });

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
