import type { SensoryPreferences } from './preferences';

/** A brief, non-looping confirmation tone. It is only called after an opt-in user preference. */
export function playCelebrationSound(preferences: SensoryPreferences): void {
  if (!preferences.sound || typeof window === 'undefined') return;
  try {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.17);
    oscillator.addEventListener('ended', () => void context.close());
  } catch {
    // Browsers can reject audio playback; visual/text feedback still proceeds.
  }
}

/** Uses the web-standard Vibration API when available; no capability probing is retained. */
export function playCelebrationHaptic(preferences: SensoryPreferences): void {
  if (
    !preferences.haptics ||
    typeof navigator === 'undefined' ||
    typeof navigator.vibrate !== 'function'
  )
    return;
  try {
    navigator.vibrate([18, 28, 18]);
  } catch {
    // Some browsers expose the API but reject it in their current context.
  }
}
