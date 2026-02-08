import { TransitionEffect, TransitionType, PuzzlePiece } from "../transitionTypes";

export const fadeToBlackEffect: TransitionEffect = {
  type: TransitionType.WIND, // Keep same enum for compatibility
  duration: 4000,

  apply: (pieces: PuzzlePiece[], engine: any, canvasWidth: number, canvasHeight: number) => {
    // This is a pure fade effect - no physics needed
    // The fade will be handled in the render loop via opacity
    // Just mark that this effect is active
    if (engine) {
      (engine as any)._transitionType = "FADE_TO_BLACK";
      (engine as any)._transitionStartTime = Date.now();
    }
  },
};
