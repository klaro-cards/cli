/**
 * Split command line args into regular args and key=value dimensions.
 * @param args - Array of command line arguments
 * @returns Object with regularArgs and dimensionArgs separated
 */
export function splitArgs(args: string[]): { regularArgs: string[]; dimensionArgs: string[] } {
  const regularArgs: string[] = [];
  const dimensionArgs: string[] = [];

  for (const arg of args) {
    if (arg.includes('=')) {
      dimensionArgs.push(arg);
    } else {
      regularArgs.push(arg);
    }
  }

  return { regularArgs, dimensionArgs };
}

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
