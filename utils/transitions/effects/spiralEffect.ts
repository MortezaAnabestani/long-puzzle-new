import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const wipeTransitionEffect: TransitionEffect = {
  type: TransitionType.SPIRAL,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (engine) {
      (engine as any)._transitionType = "WIPE";
      (engine as any)._transitionStartTime = Date.now();
      (engine as any)._wipeDirection = Math.random() > 0.5 ? "LEFT_TO_RIGHT" : "TOP_TO_BOTTOM";
    }
  },
};
