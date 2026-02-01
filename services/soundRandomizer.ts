/**
 * Sound Randomizer Service
 *
 * مدیریت انتخاب تصادفی افکت‌های صوتی برای هر ویدئو
 */

import { sonicEngine, SoundType } from './proceduralAudio';
import { assetApi } from './api/assetApi';

const SOUND_TYPE_MAPPING: Record<SoundType, string> = {
  'SNAP': 'snap',
  'MOVE': 'slide',
  'WAVE': 'wave',
  'DESTRUCT': 'fall'
};

interface SoundVariant {
  id: string;
  name: string;
  file: File;
}

class SoundRandomizerService {
  private manualVariants: Map<SoundType, SoundVariant[]> = new Map();

  /**
   * ثبت افکت‌های دستی برای استفاده در randomization
   */
  setManualVariants(type: SoundType, variants: SoundVariant[]) {
    this.manualVariants.set(type, variants);
  }

  /**
   * دریافت لیست افکت‌های دستی
   */
  getManualVariants(type: SoundType): SoundVariant[] {
    return this.manualVariants.get(type) || [];
  }

  /**
   * انتخاب تصادفی یک افکت از دیتابیس یا لیست دستی
   */
  async randomizeSound(type: SoundType, preferBackend: boolean = true): Promise<boolean> {
    console.log(`🎲 [SoundRandomizer] Randomizing ${type}...`);

    // اولویت اول: دیتابیس (اگر preferBackend فعال باشد)
    if (preferBackend) {
      const backendType = SOUND_TYPE_MAPPING[type];
      try {
        const soundUrl = await assetApi.getSoundByType(backendType);
        if (soundUrl) {
          const response = await fetch(soundUrl, {
            headers: {
              'ngrok-skip-browser-warning': 'true'
            }
          });

          if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], `${backendType}_random.mp3`, { type: 'audio/mpeg' });
            await sonicEngine.setSound(type, file);
            console.log(`✅ [SoundRandomizer] Loaded ${type} from backend`);
            return true;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [SoundRandomizer] Backend fetch failed for ${type}:`, error);
      }
    }

    // اولویت دوم: لیست دستی
    const manualList = this.manualVariants.get(type);
    if (manualList && manualList.length > 0) {
      const randomVariant = manualList[Math.floor(Math.random() * manualList.length)];
      await sonicEngine.setSound(type, randomVariant.file);
      console.log(`✅ [SoundRandomizer] Loaded ${type} from manual list (${randomVariant.name})`);
      return true;
    }

    console.warn(`⚠️ [SoundRandomizer] No sounds available for ${type}`);
    return false;
  }

  /**
   * Randomize کردن همه افکت‌ها برای یک ویدئوی جدید
   */
  async randomizeAllSounds(preferBackend: boolean = true): Promise<void> {
    console.log(`🎲 [SoundRandomizer] Randomizing all sounds for new video...`);

    const soundTypes: SoundType[] = ['SNAP', 'MOVE', 'WAVE', 'DESTRUCT'];

    for (const type of soundTypes) {
      await this.randomizeSound(type, preferBackend);
    }

    console.log(`✅ [SoundRandomizer] All sounds randomized`);
  }

  /**
   * پاک کردن تمام variant های ذخیره شده
   */
  clearAllVariants() {
    this.manualVariants.clear();
  }
}

// Singleton instance
export const soundRandomizer = new SoundRandomizerService();

// Export types
export type { SoundVariant };
