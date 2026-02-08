import {
  TransitionType,
  TransitionEffect,
  PuzzlePiece,
  TransitionConfig,
  DEFAULT_TRANSITION_CONFIG,
} from "./transitionTypes";

import { fadeToBlackEffect } from "./effects/windEffect";
import { pageTurnEffect } from "./effects/collapseEffect";
import { pixelateDissolveEffect } from "./effects/explosionEffect";
import { wipeTransitionEffect } from "./effects/spiralEffect";
import { zoomOutEffect } from "./effects/waveEffect";
import { gravityEffect } from "./effects/gravityEffect";
import { magnetEffect } from "./effects/magnetEffect";
import { tornadoEffect } from "./effects/tornadoEffect";
import { implosionEffect } from "./effects/implosionEffect";
import { scatterEffect } from "./effects/scatterEffect";

class TransitionEngine {
  private effects: Map<TransitionType, TransitionEffect>;
  private config: TransitionConfig;
  private currentEngine: any = null;
  private transitionStartTime: number = 0;
  private transitionType: string | null = null;

  constructor() {
    this.config = { ...DEFAULT_TRANSITION_CONFIG };
    this.effects = new Map([
      [TransitionType.WIND, fadeToBlackEffect],
      [TransitionType.COLLAPSE, pageTurnEffect],
      [TransitionType.EXPLOSION, pixelateDissolveEffect],
      [TransitionType.SPIRAL, wipeTransitionEffect],
      [TransitionType.WAVE, zoomOutEffect],
      // Removed physics-heavy effects for cleaner transitions
    ]);
  }

  /**
   * Get random effect from available effects
   */
  getRandomEffect(): TransitionEffect {
    const effectTypes = Array.from(this.effects.keys());
    const randomType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
    return this.effects.get(randomType)!;
  }

  /**
   * Get specific effect by type
   */
  getEffect(type: TransitionType): TransitionEffect | undefined {
    return this.effects.get(type);
  }

  /**
   * Apply transition with full timing control
   * Returns: cleanup function to call when component unmounts
   */
  applyTransition(
    pieces: PuzzlePiece[],
    engine: any,
    canvasWidth: number,
    canvasHeight: number,
    effect?: TransitionEffect,
    onComplete?: () => void
  ): () => void {
    const selectedEffect = effect || this.getRandomEffect();
    this.currentEngine = engine;

    let timeoutId: number | null = null;
    let completionTimeoutId: number | null = null;

    // Wait 3 seconds after puzzle completion
    timeoutId = window.setTimeout(() => {
      console.log(`🎬 [Transition] Starting ${selectedEffect.type} effect`);

      // Apply the effect (stores metadata in engine)
      selectedEffect.apply(pieces, engine, canvasWidth, canvasHeight);

      // Store transition info for rendering
      if (engine) {
        this.transitionStartTime = Date.now();
        this.transitionType = (engine as any)._transitionType || null;
      }

      // Complete after transition duration
      completionTimeoutId = window.setTimeout(() => {
        console.log(`✅ [Transition] ${selectedEffect.type} complete`);
        if (onComplete) onComplete();
      }, this.config.transitionDuration);
    }, this.config.waitTime);

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (completionTimeoutId) clearTimeout(completionTimeoutId);
      this.cleanup();
    };
  }

  /**
   * Cleanup physics engine
   */
  cleanup(): void {
    this.currentEngine = null;
    this.transitionStartTime = 0;
    this.transitionType = null;
  }

  /**
   * Get transition progress (0-1)
   */
  getTransitionProgress(): number {
    if (!this.transitionStartTime) return 0;
    const elapsed = Date.now() - this.transitionStartTime;
    return Math.min(elapsed / this.config.transitionDuration, 1);
  }

  /**
   * Get current transition type
   */
  getTransitionType(): string | null {
    return this.transitionType;
  }

  /**
   * Update physics engine (not needed for new transitions, kept for compatibility)
   */
  update(deltaTime: number = 16.666): void {
    // New transitions don't use physics update
  }

  /**
   * Get physics data (returns empty for new transitions)
   */
  getPhysicsData(): Map<number, { x: number; y: number; angle: number }> {
    return new Map();
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<TransitionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TransitionConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const transitionEngine = new TransitionEngine();
export { TransitionType, TransitionEffect };
