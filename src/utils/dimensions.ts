/**
 * Parse dimension arguments from command line (key=value format).
 * @param dimensionArgs - Array of dimension strings in "key=value" format
 * @returns Object mapping dimension keys to values
 * @throws Error if any dimension is not in "key=value" format
 */
export function parseDimensions(dimensionArgs?: string[]): Record<string, string> {
  const dimensions: Record<string, string> = {};

  if (!dimensionArgs) {
    return dimensions;
  }

  for (const arg of dimensionArgs) {
    const eqIndex = arg.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid dimension format: "${arg}". Expected format: key=value`);
    }
    const key = arg.substring(0, eqIndex);
    const value = arg.substring(eqIndex + 1);
    dimensions[key] = value;
  }

  return dimensions;
}
