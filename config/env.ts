/**
 * Environment Configuration
 *
 * مدیریت مرکزی تنظیمات محیطی برنامه
 * برای تغییر Backend URL، فقط این فایل را ویرایش کنید
 */

// ==================== BACKEND URL ====================
// 🔧 برای تغییر آدرس backend، فقط این خط را ویرایش کنید:
export const BACKEND_URL = "https://unsettledly-intersesamoid-paris.ngrok-free.dev";

// ==================== API ENDPOINTS ====================
export const API_ENDPOINTS = {
  // Base URLs
  BASE: BACKEND_URL,
  API: `${BACKEND_URL}/api`,
  ASSETS: `${BACKEND_URL}/assets`,

  // Content API
  CONTENT: `${BACKEND_URL}/api/content`,
  CONTENT_STATS: `${BACKEND_URL}/api/content/stats/overview`,
  CONTENT_SIMILARITY: `${BACKEND_URL}/api/content/check-similarity`,

  // Assets API
  ASSETS_CATALOG: `${BACKEND_URL}/api/assets/catalog`,
  ASSETS_MUSIC: `${BACKEND_URL}/api/assets/music`,
  ASSETS_SOUNDS: `${BACKEND_URL}/api/assets/sounds`,
  ASSETS_IMAGES: `${BACKEND_URL}/api/assets/images`,

  // Health Check
  HEALTH: `${BACKEND_URL}/api/health`,
};

// ==================== HEADERS ====================
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * دریافت URL کامل برای یک asset
 */
export const getAssetUrl = (filename: string): string => {
  return `${API_ENDPOINTS.ASSETS}/${filename}`;
};

/**
 * دریافت URL کامل برای موسیقی بر اساس mood
 */
export const getMusicUrl = (mood: string): string => {
  return `${API_ENDPOINTS.ASSETS_MUSIC}?mood=${mood}`;
};

/**
 * دریافت URL کامل برای sound effect بر اساس type
 */
export const getSoundUrl = (type: string): string => {
  return `${API_ENDPOINTS.ASSETS_SOUNDS}?type=${type}`;
};

/**
 * بررسی اتصال به backend
 */
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(API_ENDPOINTS.HEALTH, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ [Config] Backend connection failed:', error);
    return false;
  }
};

// ==================== DEVELOPMENT MODE ====================
export const isDevelopment = (): boolean => {
  return BACKEND_URL.includes('localhost') || BACKEND_URL.includes('ngrok');
};

// ==================== EXPORT ALL ====================
export default {
  BACKEND_URL,
  API_ENDPOINTS,
  DEFAULT_HEADERS,
  getAssetUrl,
  getMusicUrl,
  getSoundUrl,
  checkBackendConnection,
  isDevelopment,
};
