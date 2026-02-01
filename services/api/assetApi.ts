/**
 * Asset API Service
 *
 * دسترسی به فایل‌های استاتیک از Backend (موسیقی، sound effects، تصاویر)
 */

import { API_ENDPOINTS, DEFAULT_HEADERS, BACKEND_URL } from '../../config/env';

interface AssetCatalog {
  music: {
    [mood: string]: MusicAsset[];
  };
  sounds: {
    [type: string]: SoundAsset[];
  };
  images: {
    profiles: ImageAsset[];
  };
}

interface MusicAsset {
  id: string;
  filename: string;
  title: string;
  mood: string;
  bpm: number;
  duration: number;
  description: string;
}

interface SoundAsset {
  id: string;
  filename: string;
  title: string;
  type: string;
  description: string;
}

interface ImageAsset {
  id: string;
  filename: string;
  title: string;
  description: string;
}

class AssetApiService {
  private catalog: AssetCatalog | null = null;

  constructor() {
    // No need to store baseUrl anymore, use API_ENDPOINTS directly
  }

  /**
   * دریافت کاتالوگ کامل assets
   */
  async getCatalog(): Promise<AssetCatalog | null> {
    if (this.catalog) {
      return this.catalog; // Return cached
    }

    try {
      console.log(`📦 [Assets] Fetching catalog from ${BACKEND_URL}...`);

      const response = await fetch(API_ENDPOINTS.ASSETS_CATALOG, {
        method: "GET",
        headers: DEFAULT_HEADERS,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.catalog = data.data;
          console.log(`✅ [Assets] Catalog loaded successfully`);
          return this.catalog;
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ [Assets] Failed to load catalog:`, error.message);
    }

    return null;
  }

  /**
   * دریافت URL کامل یک asset
   */
  getAssetUrl(filename: string): string {
    return `${API_ENDPOINTS.ASSETS}/${filename}`;
  }

  /**
   * دریافت موسیقی بر اساس mood
   */
  async getMusicByMood(mood: string): Promise<MusicAsset[]> {
    try {
      console.log(`🎵 [Assets] Fetching music for mood: ${mood}...`);

      const response = await fetch(`${API_ENDPOINTS.ASSETS_MUSIC}?mood=${mood}`, {
        method: "GET",
        headers: DEFAULT_HEADERS,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log(`✅ [Assets] Found ${data.data.length} tracks for ${mood}`);
          return data.data;
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ [Assets] Failed to fetch music:`, error.message);
    }

    return [];
  }

  /**
   * انتخاب تصادفی یک موسیقی از mood
   */
  async getRandomMusicByMood(mood: string): Promise<string | null> {
    const tracks = await this.getMusicByMood(mood);
    if (tracks.length === 0) {
      return null;
    }

    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    const url = this.getAssetUrl(randomTrack.filename);

    console.log(`🎶 [Assets] Selected: "${randomTrack.title}" (${randomTrack.bpm} BPM)`);
    return url;
  }

  /**
   * دریافت sound effects بر اساس type
   */
  async getSoundsByType(type: string): Promise<SoundAsset[]> {
    try {
      console.log(`🔊 [Assets] Fetching sounds for type: ${type}...`);

      const response = await fetch(`${API_ENDPOINTS.ASSETS_SOUNDS}?type=${type}`, {
        method: "GET",
        headers: DEFAULT_HEADERS,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log(`✅ [Assets] Found ${data.data.length} sounds for ${type}`);
          return data.data;
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ [Assets] Failed to fetch sounds:`, error.message);
    }

    return [];
  }

  /**
   * دریافت یک sound effect به صورت random از یک type
   */
  async getSoundByType(type: string): Promise<string | null> {
    const sounds = await this.getSoundsByType(type);
    if (sounds.length === 0) {
      return null;
    }

    // انتخاب تصادفی از لیست
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    const url = this.getAssetUrl(randomSound.filename);

    console.log(`🔉 [Assets] Selected random sound: "${randomSound.title}" (${sounds.length} available)`);
    return url;
  }

  /**
   * دریافت لیست تصاویر پروفایل
   */
  async getProfileImages(): Promise<ImageAsset[]> {
    try {
      console.log(`🖼️ [Assets] Fetching profile images...`);

      const response = await fetch(API_ENDPOINTS.ASSETS_IMAGES, {
        method: "GET",
        headers: DEFAULT_HEADERS,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.profiles) {
          console.log(`✅ [Assets] Found ${data.data.profiles.length} profile images`);
          return data.data.profiles;
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ [Assets] Failed to fetch images:`, error.message);
    }

    return [];
  }

  /**
   * دریافت اولین تصویر پروفایل
   */
  async getFirstProfileImage(): Promise<string | null> {
    const images = await this.getProfileImages();
    if (images.length === 0) {
      return null;
    }

    const image = images[0];
    const url = this.getAssetUrl(image.filename);

    console.log(`🖼️ [Assets] Selected image: "${image.title}"`);
    return url;
  }

  /**
   * بارگذاری یک asset به صورت Blob
   */
  async fetchAssetAsBlob(filename: string): Promise<Blob | null> {
    try {
      const url = this.getAssetUrl(filename);
      const response = await fetch(url, {
        headers: DEFAULT_HEADERS,
      });

      if (response.ok) {
        return await response.blob();
      }
    } catch (error: any) {
      console.warn(`⚠️ [Assets] Failed to fetch blob:`, error.message);
    }

    return null;
  }

  /**
   * بارگذاری یک asset به صورت Blob URL
   */
  async fetchAssetAsBlobUrl(filename: string): Promise<string | null> {
    const blob = await this.fetchAssetAsBlob(filename);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  }
}

// Singleton instance
export const assetApi = new AssetApiService();

// Export types
export type { AssetCatalog, MusicAsset, SoundAsset, ImageAsset };
