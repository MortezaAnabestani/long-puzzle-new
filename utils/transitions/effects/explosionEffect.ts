import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const pixelateDissolveEffect: TransitionEffect = {
  type: TransitionType.EXPLOSION,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (engine) {
      (engine as any)._transitionType = "PIXELATE_DISSOLVE";
      (engine as any)._transitionStartTime = Date.now();
    }
  },
};
