import { Bmg } from '@enspirit/bmg-js';

export function formatTable<T extends object>(rows: T[]): string {
  if (rows.length === 0) {
    return 'No items found.';
  }
  return Bmg(rows as Record<string, unknown>[]).toText();
}

export function printTable<T extends object>(rows: T[]): void {
  console.log(formatTable(rows));
}
