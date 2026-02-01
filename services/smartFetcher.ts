/**
 * Smart Fetcher Service
 *
 * این سرویس بر اساس BackendMode تصمیم می‌گیرد که از کجا داده دریافت کند:
 * - JSON Mode: فقط از AI و منابع خارجی
 * - All Mode: اولویت با Backend، در صورت شکست از AI
 */

import { BackendMode, MusicMood } from '../types';
import { assetApi } from './api/assetApi';
import { findSmartMusicByMood } from './ai/musicSelection';
import { soundRandomizer } from './soundRandomizer';
import { SmartMusicTrack } from './types/serviceTypes';

class SmartFetcherService {
  private currentMode: BackendMode = BackendMode.ALL;

  /**
   * تنظیم حالت فعلی
   */
  setMode(mode: BackendMode) {
    this.currentMode = mode;
    console.log(`🔄 [SmartFetcher] Mode changed to: ${mode.toUpperCase()}`);
  }

  /**
   * دریافت موسیقی هوشمند
   */
  async fetchMusic(mood: MusicMood, topic: string): Promise<SmartMusicTrack | null> {
    console.log(`🎵 [SmartFetcher] Fetching music for mood: ${mood}`);

    if (this.currentMode === BackendMode.ALL) {
      // حالت All: ابتدا از backend سعی کن
      try {
        console.log(`   Trying backend first (All Mode)...`);
        const musicUrl = await assetApi.getRandomMusicByMood(mood);

        if (musicUrl) {
          console.log(`✅ [SmartFetcher] Music loaded from backend`);
          return {
            title: `Backend Music - ${mood}`,
            url: musicUrl,
            source: 'Backend Database',
          };
        }
      } catch (error) {
        console.warn(`⚠️ [SmartFetcher] Backend music fetch failed:`, error);
      }
    }

    // حالت JSON یا fallback از All: از AI استفاده کن
    console.log(`   Using AI music selection...`);
    const aiMusic = await findSmartMusicByMood(mood, topic);

    if (aiMusic) {
      console.log(`✅ [SmartFetcher] Music found via AI`);
      return aiMusic;
    }

    console.warn(`⚠️ [SmartFetcher] No music found`);
    return null;
  }

  /**
   * دریافت sound effects
   */
  async fetchSoundEffects(forceBackend: boolean = false): Promise<boolean> {
    console.log(`🔊 [SmartFetcher] Fetching sound effects...`);

    const useBackend = this.currentMode === BackendMode.ALL || forceBackend;

    if (useBackend) {
      try {
        await soundRandomizer.randomizeAllSounds(true);
        console.log(`✅ [SmartFetcher] Sound effects loaded from backend`);
        return true;
      } catch (error) {
        console.warn(`⚠️ [SmartFetcher] Backend sound effects failed:`, error);
      }
    }

    // در حالت JSON یا fallback از لیست دستی استفاده کن
    console.log(`   Using manual sound list...`);
    await soundRandomizer.randomizeAllSounds(false);
    return true;
  }

  /**
   * دریافت تصویر profile
   */
  async fetchProfileImage(): Promise<string | null> {
    console.log(`🖼️ [SmartFetcher] Fetching profile image...`);

    if (this.currentMode === BackendMode.ALL) {
      try {
        console.log(`   Trying backend first (All Mode)...`);
        const imageUrl = await assetApi.getFirstProfileImage();

        if (imageUrl) {
          console.log(`✅ [SmartFetcher] Profile image loaded from backend`);
          return imageUrl;
        }
      } catch (error) {
        console.warn(`⚠️ [SmartFetcher] Backend image fetch failed:`, error);
      }
    }

    console.log(`   No profile image available (JSON Mode or backend failed)`);
    return null;
  }

  /**
   * دریافت حالت فعلی
   */
  getMode(): BackendMode {
    return this.currentMode;
  }

  /**
   * آیا backend فعال است؟
   */
  isBackendEnabled(): boolean {
    return this.currentMode === BackendMode.ALL;
  }
}

// Singleton instance
export const smartFetcher = new SmartFetcherService();
