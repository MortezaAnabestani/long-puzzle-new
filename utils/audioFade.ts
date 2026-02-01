/**
 * Audio Fade Utility
 *
 * Provides smooth fade-in and fade-out transitions for HTMLAudioElement
 * to create pleasant audio experiences without abrupt starts/stops
 */

export interface FadeOptions {
  duration?: number; // Duration in milliseconds (default: 2000 for fade-in, 1500 for fade-out)
  targetVolume?: number; // Target volume (0.0 to 1.0, default: 1.0)
  curve?: 'linear' | 'exponential'; // Fade curve type (default: 'exponential')
}

// Track active fade intervals to allow cancellation
const activeFades = new WeakMap<HTMLAudioElement, number>();

/**
 * Smoothly fade in audio from 0 to target volume
 */
export const fadeIn = (
  audio: HTMLAudioElement,
  options: FadeOptions = {}
): Promise<void> => {
  const {
    duration = 2000,
    targetVolume = 1.0,
    curve = 'exponential'
  } = options;

  return new Promise((resolve) => {
    // Cancel any existing fade on this audio element
    cancelFade(audio);

    // Start from silence
    audio.volume = 0;

    const startTime = Date.now();
    const steps = 60; // 60 steps for smooth transition
    const stepDuration = duration / steps;

    const fadeInterval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (progress >= 1.0) {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
        activeFades.delete(audio);
        resolve();
        return;
      }

      // Apply fade curve
      let adjustedProgress = progress;
      if (curve === 'exponential') {
        // Exponential curve feels more natural for audio
        adjustedProgress = progress * progress;
      }

      audio.volume = adjustedProgress * targetVolume;
    }, stepDuration);

    activeFades.set(audio, fadeInterval);
  });
};

/**
 * Smoothly fade out audio from current volume to 0
 */
export const fadeOut = (
  audio: HTMLAudioElement,
  options: FadeOptions = {}
): Promise<void> => {
  const {
    duration = 1500,
    curve = 'exponential'
  } = options;

  return new Promise((resolve) => {
    // Cancel any existing fade on this audio element
    cancelFade(audio);

    const startVolume = audio.volume;
    const startTime = Date.now();
    const steps = 60;
    const stepDuration = duration / steps;

    const fadeInterval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (progress >= 1.0) {
        audio.volume = 0;
        clearInterval(fadeInterval);
        activeFades.delete(audio);
        resolve();
        return;
      }

      // Apply fade curve (inverted for fade-out)
      let adjustedProgress = progress;
      if (curve === 'exponential') {
        adjustedProgress = progress * progress;
      }

      audio.volume = startVolume * (1 - adjustedProgress);
    }, stepDuration);

    activeFades.set(audio, fadeInterval);
  });
};

/**
 * Cancel any active fade on an audio element
 */
export const cancelFade = (audio: HTMLAudioElement): void => {
  const activeInterval = activeFades.get(audio);
  if (activeInterval !== undefined) {
    clearInterval(activeInterval);
    activeFades.delete(audio);
  }
};

/**
 * Play audio with smooth fade-in
 */
export const playWithFade = async (
  audio: HTMLAudioElement,
  options: FadeOptions = {}
): Promise<void> => {
  try {
    await audio.play();
    await fadeIn(audio, options);
  } catch (error) {
    console.error('Failed to play audio with fade:', error);
  }
};

/**
 * Pause audio with smooth fade-out
 */
export const pauseWithFade = async (
  audio: HTMLAudioElement,
  options: FadeOptions = {}
): Promise<void> => {
  try {
    await fadeOut(audio, options);
    audio.pause();
  } catch (error) {
    console.error('Failed to pause audio with fade:', error);
  }
};
