import { Bmg } from '@enspirit/bmg-js';

type Tuple = Record<string, unknown>;

/**
 * Format an array of tuples as a table string with rounded borders.
 *
 * @param data - Array of objects to display
 * @param columns - Column names to include in output
 * @returns Formatted table string
 */
export function formatTable(data: Tuple[], columns: string[]): string {
  return Bmg(data).project(columns).toText({ border: 'rounded' });
}

/**
 * Print an array of tuples as a formatted table with rounded borders.
 *
 * @param data - Array of objects to display
 * @param columns - Column names to include in output
 */
export function printTable(data: Tuple[], columns: string[]): void {
  console.log(formatTable(data, columns));
}
