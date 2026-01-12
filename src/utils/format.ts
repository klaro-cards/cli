/**
 * Truncate a string to a maximum length, adding ellipsis if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (maxLength < 4) return str.slice(0, maxLength);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Format dimension values for display.
 * Shows up to 6 IDs, with ellipsis if there are more.
 * Filters out null IDs.
 *
 * @param values - Array of dimension values with id, code, and optional label
 * @returns Formatted string of IDs
 */
export function formatDimensionValues(
  values: Array<{ id: number | null; code: string; label?: string }> | undefined
): string {
  if (!values || values.length === 0) {
    return '';
  }
  const filtered = values.filter(v => v.id !== null);
  const ids = filtered.slice(0, 6).map(v => v.id);
  return filtered.length > 6 ? `${ids.join(', ')}, ...` : ids.join(', ');
}
