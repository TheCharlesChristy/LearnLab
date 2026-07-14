/** Local-only diagnostic storage bounds for Experience Runtime v2/B4. */
export const RUN_EVENT_MAX_BYTES = 16 * 1024;
export const RUN_PROJECTION_MAX_BYTES = 64 * 1024;
export const RUN_EVENT_MAX_PER_RUN = 1_000;
export const RUN_EVENT_MAX_TOTAL = 10_000;

export function assertWithinRunStorageCap(
  value: unknown,
  maximum: number,
  label: string,
): void {
  let bytes: number;
  try {
    bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    throw new Error('Run state must be JSON-safe.');
  }
  if (bytes > maximum) {
    throw new Error(`${label} exceeds its ${maximum} byte local-storage cap.`);
  }
}
