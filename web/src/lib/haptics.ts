/**
 * HAPTIC FEEDBACK UTILITIES
 *
 * Provides vibration/haptic feedback for key user interactions on mobile.
 * Falls back gracefully on web (no-op).
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Check if haptics are available (mobile only)
 */
function isHapticsAvailable(): boolean {
  return typeof window !== 'undefined' &&
         (window as unknown as { Capacitor?: unknown }).Capacitor !== undefined;
}

/**
 * Trigger a light haptic impact (e.g., button taps, selections)
 */
export async function hapticsLight() {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
}

/**
 * Trigger a medium haptic impact (e.g., important actions, confirmations)
 */
export async function hapticsMedium() {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
}

/**
 * Trigger a heavy haptic impact (e.g., errors, critical actions)
 */
export async function hapticsHeavy() {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
}

/**
 * Trigger a success haptic notification
 */
export async function hapticsSuccess() {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
}

/**
 * Trigger a warning haptic notification
 */
export async function hapticsWarning() {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
}

/**
 * Trigger an error haptic notification
 */
export async function hapticsError() {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
}

/**
 * Trigger a selection change haptic (e.g., scrolling through options)
 */
export async function hapticsSelection() {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
}
