import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const zoomOutEffect: TransitionEffect = {
  type: TransitionType.WAVE,
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    if (engine) {
      (engine as any)._transitionType = "ZOOM_OUT";
      (engine as any)._transitionStartTime = Date.now();
    }
  },
};
