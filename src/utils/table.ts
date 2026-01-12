import { Bmg } from '@enspirit/bmg-js';
import { truncate } from './format.js';

type Tuple = Record<string, unknown>;

const BORDER_OVERHEAD = 4; // "│ " + " │" for outer borders
const COLUMN_SEPARATOR = 3; // " │ " between columns
const MIN_TITLE_WIDTH = 20;
const DEFAULT_TERMINAL_WIDTH = 80;

/**
 * Calculate the maximum width available for the title column.
 */
function calculateTitleWidth(data: Tuple[], columns: string[]): number {
  const terminalWidth = process.stdout.columns || DEFAULT_TERMINAL_WIDTH;

  // Calculate width needed for non-title columns
  let usedWidth = BORDER_OVERHEAD;
  for (const col of columns) {
    if (col === 'title') continue;
    const maxValueLen = Math.max(
      col.length,
      ...data.map(row => String(row[col] ?? '').length)
    );
    usedWidth += maxValueLen + COLUMN_SEPARATOR;
  }

  // Title column header is 5 chars
  const titleHeaderWidth = 'title'.length;
  const availableWidth = terminalWidth - usedWidth - COLUMN_SEPARATOR;

  return Math.max(MIN_TITLE_WIDTH, titleHeaderWidth, availableWidth);
}

/**
 * Truncate title fields to fit terminal width.
 */
function fitToTerminal(data: Tuple[], columns: string[]): Tuple[] {
  if (!columns.includes('title')) return data;

  const titleWidth = calculateTitleWidth(data, columns);
  return data.map(row => ({
    ...row,
    title: truncate(String(row.title ?? ''), titleWidth),
  }));
}

/**
 * Format an array of tuples as a table string with rounded borders.
 *
 * @param data - Array of objects to display
 * @param columns - Column names to include in output
 * @returns Formatted table string
 */
export function formatTable(data: Tuple[], columns: string[]): string {
  const fitted = fitToTerminal(data, columns);
  return Bmg(fitted).project(columns).toText({ border: 'rounded' });
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
