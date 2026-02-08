import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const pageTurnEffect: TransitionEffect = {
  type: TransitionType.COLLAPSE,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (engine) {
      (engine as any)._transitionType = "PAGE_TURN";
      (engine as any)._transitionStartTime = Date.now();
    }
  },
};
