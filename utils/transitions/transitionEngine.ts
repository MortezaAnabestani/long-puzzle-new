import {
  TransitionType,
  TransitionEffect,
  PuzzlePiece,
  TransitionConfig,
  DEFAULT_TRANSITION_CONFIG,
} from "./transitionTypes";

import { sweepEffect } from "./effects/sweepEffect"; // 🧹 افکت جاروزدن جدید

class TransitionEngine {
  private effects: Map<TransitionType, TransitionEffect>;
  private config: TransitionConfig;
  private currentEngine: any = null;
  private transitionStartTime: number = 0;
  private transitionType: string | null = null;
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;

  constructor() {
    this.config = { ...DEFAULT_TRANSITION_CONFIG };
    this.effects = new Map([
      [TransitionType.SWEEP, sweepEffect], // 🧹 Natural sweeping motion (6s duration)
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
   * Apply transition with IMMEDIATE start (no delay)
   * Returns: cleanup function to call when component unmounts
   */
  applyTransition(
    pieces: PuzzlePiece[],
    engine: any,
    canvasWidth: number,
    canvasHeight: number,
    effect?: TransitionEffect,
    onComplete?: () => void,
  ): () => void {
    const selectedEffect = effect || this.getRandomEffect();
    this.currentEngine = engine;

    let completionTimeoutId: number | null = null;

    console.log(`🎬 [Transition] Starting ${selectedEffect.type} effect IMMEDIATELY`);

    // بلافاصله شروع می‌شود
    selectedEffect.apply(pieces, engine, canvasWidth, canvasHeight);

    // Store transition info for rendering
    if (engine) {
      this.transitionStartTime = Date.now();
      this.transitionType = (engine as any)._transitionType || null;

      // شروع به‌روزرسانی فیزیک اگر فعال باشد
      if ((engine as any)._physicsEnabled) {
        this.startPhysicsUpdate();
      }
    }

    // Complete after transition duration
    completionTimeoutId = window.setTimeout(() => {
      console.log(`✅ [Transition] ${selectedEffect.type} complete`);
      this.stopPhysicsUpdate();
      if (onComplete) onComplete();
    }, this.config.transitionDuration);

    // Cleanup function
    return () => {
      if (completionTimeoutId) clearTimeout(completionTimeoutId);
      this.cleanup();
    };
  }

  /**
   * Start physics update loop
   */
  private startPhysicsUpdate(): void {
    if (!this.currentEngine || typeof window === "undefined") return;

    const Matter = (window as any).Matter;
    if (!Matter) return;

    this.lastUpdateTime = Date.now();

    const updateLoop = () => {
      if (!this.currentEngine || !(this.currentEngine as any)._physicsEnabled) {
        this.stopPhysicsUpdate();
        return;
      }

      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;

      // Apply wind forces if wind effect is active
      if ((this.currentEngine as any)._windForceApplier) {
        (this.currentEngine as any)._windForceApplier();
      }

      // 🧹 Apply sweep forces if sweep effect is active
      if ((this.currentEngine as any)._sweepForceApplier) {
        (this.currentEngine as any)._sweepForceApplier();
      }

      // Update Matter.js engine
      Matter.Engine.update(this.currentEngine, deltaTime);

      this.animationFrameId = requestAnimationFrame(updateLoop);
    };

    this.animationFrameId = requestAnimationFrame(updateLoop);
  }

  /**
   * Stop physics update loop
   */
  private stopPhysicsUpdate(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Cleanup physics engine
   */
  cleanup(): void {
    this.stopPhysicsUpdate();
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
   * Get physics data for rendering
   */
  getPhysicsData(): Map<
    number,
    { x: number; y: number; angle: number; scaleX?: number; scaleY?: number; opacity?: number }
  > {
    const dataMap = new Map();

    if (!this.currentEngine || typeof window === "undefined") return dataMap;

    const Matter = (window as any).Matter;
    if (!Matter) return dataMap;

    const bodies = Matter.Composite.allBodies(this.currentEngine.world);

    bodies.forEach((body: any, index: number) => {
      // نادیده گرفتن اجسام استاتیک (دیوارها و توپ‌های ویرانگر)
      if (body.isStatic || (body as any)._isBall) return;

      dataMap.set(index, {
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
      });
    });

    return dataMap;
  }

  /**
   * Get current engine (for custom rendering)
   */
  getCurrentEngine(): any {
    return this.currentEngine;
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
