/**
 * Deep merge two objects recursively.
 * Properties from source override properties in target.
 * Nested objects are merged recursively.
 * Arrays and non-object values are replaced, not merged.
 *
 * @param target - Base object to merge into
 * @param source - Object with values to merge from
 * @returns New merged object
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as object,
        sourceValue as object
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }
  return result;
}
