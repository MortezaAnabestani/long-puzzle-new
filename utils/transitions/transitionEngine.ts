import {
  TransitionType,
  TransitionEffect,
  PuzzlePiece,
  TransitionConfig,
  DEFAULT_TRANSITION_CONFIG,
} from "./transitionTypes";

import { windEffect } from "./effects/windEffect";
import { collapseEffect } from "./effects/collapseEffect";
import { explosionEffect } from "./effects/explosionEffect";
import { spiralEffect } from "./effects/spiralEffect";
import { waveEffect } from "./effects/waveEffect";
import { gravityEffect } from "./effects/gravityEffect";
import { magnetEffect } from "./effects/magnetEffect";
import { tornadoEffect } from "./effects/tornadorEffect";
import { implosionEffect } from "./effects/implodeEffect";
import { scatterEffect } from "./effects/scatterEffect";

class TransitionEngine {
  private effects: Map<TransitionType, TransitionEffect>;
  private config: TransitionConfig;
  private currentEngine: any = null;
  private currentBodies: Map<number, any> = new Map();

  constructor() {
    this.config = { ...DEFAULT_TRANSITION_CONFIG };
    this.effects = new Map([
      [TransitionType.WIND, windEffect],
      [TransitionType.COLLAPSE, collapseEffect],
      [TransitionType.EXPLOSION, explosionEffect],
      [TransitionType.SPIRAL, spiralEffect],
      [TransitionType.WAVE, waveEffect],
      [TransitionType.GRAVITY, gravityEffect],
      [TransitionType.MAGNET, magnetEffect],
      [TransitionType.TORNADO, tornadoEffect],
      [TransitionType.IMPLOSION, implosionEffect],
      [TransitionType.SCATTER, scatterEffect],
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

      // Apply the effect
      selectedEffect.apply(pieces, engine, canvasWidth, canvasHeight);

      // Store bodies for cleanup
      if (engine && engine.world && engine.world.bodies) {
        this.currentBodies.clear();
        engine.world.bodies.forEach((body: any, index: number) => {
          this.currentBodies.set(index, body);
        });
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
    if (this.currentEngine && typeof window !== "undefined") {
      const Matter = (window as any).Matter;
      if (Matter && this.currentEngine.world) {
        try {
          Matter.World.clear(this.currentEngine.world, false);
          Matter.Engine.clear(this.currentEngine);
        } catch (e) {
          console.warn("Transition cleanup error:", e);
        }
      }
    }
    this.currentBodies.clear();
    this.currentEngine = null;
  }

  /**
   * Get physics data for rendering
   */
  getPhysicsData(): Map<number, { x: number; y: number; angle: number }> {
    const data = new Map<number, { x: number; y: number; angle: number }>();

    if (!this.currentEngine || !this.currentEngine.world) return data;

    this.currentBodies.forEach((body: any, id: number) => {
      if (body && body.position) {
        data.set(id, {
          x: body.position.x,
          y: body.position.y,
          angle: body.angle,
        });
      }
    });

    return data;
  }

  /**
   * Update physics engine (call in animation loop)
   */
  update(deltaTime: number = 16.666): void {
    if (this.currentEngine && typeof window !== "undefined") {
      const Matter = (window as any).Matter;
      if (Matter && Matter.Engine) {
        Matter.Engine.update(this.currentEngine, deltaTime);
      }
    }
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
