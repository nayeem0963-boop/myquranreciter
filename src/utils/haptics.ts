/** Light vibration where supported (Android Chrome); silently ignored elsewhere. */
export function haptic(ms = 10): void {
  try {
    if (typeof navigator.vibrate === "function") navigator.vibrate(ms);
  } catch {
    /* unsupported */
  }
}
