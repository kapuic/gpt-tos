/**
 * Returns the amount of keys in `object`.
 *
 * @param object The object to count the keys of.
 * @returns The amount of keys in `object`.
 */
export function countKeys(object: Record<string, unknown>): number {
  return Object.keys(object).length;
}

/**
 * Converts time in milliseconds to seconds, precised to the thousandths
 * position.
 *
 * @param ms A number representing time in milliseconds.
 * @returns The time in seconds, to the thousandths position.
 */
export function toSeconds(ms: number): number {
  return Number((ms / 1000).toFixed(3));
}
