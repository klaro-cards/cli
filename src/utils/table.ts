import { Bmg } from '@enspirit/bmg-js';

type Tuple = Record<string, unknown>;

/**
 * Print an array of tuples as a formatted table with rounded borders.
 *
 * @param data - Array of objects to display
 * @param columns - Column names to include in output
 */
export function printTable(data: Tuple[], columns: string[]): void {
  const output = Bmg(data).project(columns).toText({ border: 'rounded' });
  console.log(output);
}
