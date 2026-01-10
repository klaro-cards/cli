export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'right';
}

export function formatTable<T extends Record<string, unknown>>(
  rows: T[],
  columns: TableColumn[]
): string {
  if (rows.length === 0) {
    return 'No items found.';
  }

  // Calculate column widths
  const widths = columns.map((col) => {
    const headerLen = col.header.length;
    const maxValueLen = Math.max(
      ...rows.map((row) => String(row[col.key] ?? '').length)
    );
    return col.width || Math.max(headerLen, maxValueLen);
  });

  // Build separator line
  const separator = '+' + widths.map((w) => '-'.repeat(w + 2)).join('+') + '+';

  // Build header row
  const headerRow =
    '|' +
    columns
      .map((col, i) => ` ${col.header.padEnd(widths[i])} `)
      .join('|') +
    '|';

  // Build data rows
  const dataRows = rows.map(
    (row) =>
      '|' +
      columns
        .map((col, i) => {
          const value = String(row[col.key] ?? '');
          const padded =
            col.align === 'right'
              ? value.padStart(widths[i])
              : value.padEnd(widths[i]);
          return ` ${padded} `;
        })
        .join('|') +
      '|'
  );

  return [separator, headerRow, separator, ...dataRows, separator].join('\n');
}

export function printTable<T extends Record<string, unknown>>(
  rows: T[],
  columns: TableColumn[]
): void {
  console.log(formatTable(rows, columns));
}
