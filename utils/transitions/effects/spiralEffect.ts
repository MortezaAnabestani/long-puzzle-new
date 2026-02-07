import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const spiralEffect: TransitionEffect = {
  type: TransitionType.SPIRAL,
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

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const clockwise = Math.random() > 0.5;
    const bodies: any[] = [];

    pieces.forEach((piece, index) => {
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

      // Calculate position relative to center
      const dx = body.position.x - centerX;
      const dy = body.position.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Calculate tangential force for spiral motion
      const angle = Math.atan2(dy, dx);
      const spiralAngle = angle + (clockwise ? Math.PI / 2 : -Math.PI / 2);

      const forceMagnitude = 0.15 * (1 + index * 0.01);

      Matter.Body.applyForce(body, body.position, {
        x: Math.cos(spiralAngle) * forceMagnitude,
        y: Math.sin(spiralAngle) * forceMagnitude * 0.5,
      });

      // Add rotation
      Matter.Body.setAngularVelocity(body, clockwise ? 0.15 : -0.15);

      bodies.push(body);
    });

    Matter.World.add(engine.world, bodies);
  },
};
