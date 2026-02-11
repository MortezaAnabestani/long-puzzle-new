/**
 * 🎯 GLOBAL PUZZLE CONFIG MANAGER
 *
 * مدیریت کانفیگ یکسان برای تمام پازل‌ها در یک پروژه
 * کانفیگ یک بار در ابتدا انتخاب می‌شود و برای همه فصل‌ها ثابت می‌ماند
 */

import { PieceShape, PieceMaterial, MovementType, PuzzleBackground } from "../types";

export interface GlobalPuzzleConfig {
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  background: PuzzleBackground;
  isLocked: boolean; // آیا کانفیگ قفل شده است؟
}

class PuzzleConfigManager {
  private config: GlobalPuzzleConfig | null = null;
  private readonly STORAGE_KEY = "puzzle_global_config";

  /**
   * تنظیم کانفیگ برای اولین بار
   */
  initializeConfig(projectId?: string): GlobalPuzzleConfig {
    // اگر قبلاً کانفیگ تنظیم شده، همان را برگردان
    if (this.config && this.config.isLocked) {
      console.log("📌 [ConfigManager] Using locked config:", this.config);
      return this.config;
    }

    // انتخاب تصادفی کانفیگ
    const shapes: PieceShape[] = ["classic", "organic", "angular", "curved", "hexagonal"];
    const materials: PieceMaterial[] = ["paper", "wood", "metal", "glass", "stone"];
    const movements: MovementType[] = ["linear", "elastic", "drift", "magnetic", "orbital"];
    const backgrounds: PuzzleBackground[] = ["solid", "gradient", "noise", "particles", "waves"];

    const randomConfig: GlobalPuzzleConfig = {
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      material: materials[Math.floor(Math.random() * materials.length)],
      movement: movements[Math.floor(Math.random() * movements.length)],
      background: backgrounds[Math.floor(Math.random() * backgrounds.length)],
      isLocked: true,
    };

    this.config = randomConfig;

    console.log("🎲 [ConfigManager] Initialized random config:", randomConfig);

    // ذخیره در localStorage (اختیاری)
    if (projectId) {
      this.saveToStorage(projectId, randomConfig);
    }

    return randomConfig;
  }

  /**
   * دریافت کانفیگ فعلی
   */
  getConfig(): GlobalPuzzleConfig | null {
    return this.config;
  }

  /**
   * بازنشانی کانفیگ (برای پروژه جدید)
   */
  resetConfig(): void {
    console.log("🔄 [ConfigManager] Config reset");
    this.config = null;
  }

  /**
   * تنظیم دستی کانفیگ (برای تست یا override)
   */
  setConfig(config: Partial<GlobalPuzzleConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...config };
    } else {
      this.config = {
        shape: config.shape || "classic",
        material: config.material || "paper",
        movement: config.movement || "linear",
        background: config.background || "solid",
        isLocked: config.isLocked !== undefined ? config.isLocked : true,
      };
    }
    console.log("⚙️ [ConfigManager] Config manually set:", this.config);
  }

  /**
   * بارگذاری از localStorage
   */
  loadFromStorage(projectId: string): GlobalPuzzleConfig | null {
    try {
      const key = `${this.STORAGE_KEY}_${projectId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const config = JSON.parse(stored) as GlobalPuzzleConfig;
        this.config = config;
        console.log("💾 [ConfigManager] Config loaded from storage:", config);
        return config;
      }
    } catch (error) {
      console.error("❌ [ConfigManager] Failed to load from storage:", error);
    }
    return null;
  }

  /**
   * ذخیره در localStorage
   */
  private saveToStorage(projectId: string, config: GlobalPuzzleConfig): void {
    try {
      const key = `${this.STORAGE_KEY}_${projectId}`;
      localStorage.setItem(key, JSON.stringify(config));
      console.log("💾 [ConfigManager] Config saved to storage");
    } catch (error) {
      console.error("❌ [ConfigManager] Failed to save to storage:", error);
    }
  }

  /**
   * پاک کردن از localStorage
   */
  clearStorage(projectId: string): void {
    try {
      const key = `${this.STORAGE_KEY}_${projectId}`;
      localStorage.removeItem(key);
      console.log("🗑️ [ConfigManager] Storage cleared");
    } catch (error) {
      console.error("❌ [ConfigManager] Failed to clear storage:", error);
    }
  }
}

// Singleton instance
export const puzzleConfigManager = new PuzzleConfigManager();

/**
 * هوک React برای استفاده آسان
 */
export const usePuzzleConfig = (projectId?: string) => {
  const ensureConfig = () => {
    let config = puzzleConfigManager.getConfig();

    if (!config) {
      // سعی کن از storage بارگذاری کنی
      if (projectId) {
        config = puzzleConfigManager.loadFromStorage(projectId);
      }

      // اگر هنوز config نداری، یکی جدید بساز
      if (!config) {
        config = puzzleConfigManager.initializeConfig(projectId);
      }
    }

    return config;
  };

  return {
    config: ensureConfig(),
    resetConfig: () => puzzleConfigManager.resetConfig(),
    setConfig: (newConfig: Partial<GlobalPuzzleConfig>) => puzzleConfigManager.setConfig(newConfig),
  };
};
