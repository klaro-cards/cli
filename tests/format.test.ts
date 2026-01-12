import { describe, it, expect } from 'vitest';
import { formatDimensionValues, truncate } from '../src/utils/format.js';

describe('formatDimensionValues', () => {
  it('returns empty string for undefined', () => {
    expect(formatDimensionValues(undefined)).toBe('');
  });

  it('returns empty string for empty array', () => {
    expect(formatDimensionValues([])).toBe('');
  });

  it('formats single value', () => {
    const values = [{ id: 1, code: 'open', label: 'Open' }];
    expect(formatDimensionValues(values)).toBe('1');
  });

  it('formats multiple values', () => {
    const values = [
      { id: 1, code: 'open', label: 'Open' },
      { id: 2, code: 'closed', label: 'Closed' },
      { id: 3, code: 'pending', label: 'Pending' },
    ];
    expect(formatDimensionValues(values)).toBe('1, 2, 3');
  });

  it('filters out null IDs', () => {
    const values = [
      { id: null, code: 'none', label: 'None' },
      { id: 1, code: 'open', label: 'Open' },
      { id: 2, code: 'closed', label: 'Closed' },
    ];
    expect(formatDimensionValues(values)).toBe('1, 2');
  });

  it('truncates at 6 values with ellipsis', () => {
    const values = [
      { id: 1, code: 'a' },
      { id: 2, code: 'b' },
      { id: 3, code: 'c' },
      { id: 4, code: 'd' },
      { id: 5, code: 'e' },
      { id: 6, code: 'f' },
      { id: 7, code: 'g' },
    ];
    expect(formatDimensionValues(values)).toBe('1, 2, 3, 4, 5, 6, ...');
  });

  it('shows all 6 values without ellipsis when exactly 6', () => {
    const values = [
      { id: 1, code: 'a' },
      { id: 2, code: 'b' },
      { id: 3, code: 'c' },
      { id: 4, code: 'd' },
      { id: 5, code: 'e' },
      { id: 6, code: 'f' },
    ];
    expect(formatDimensionValues(values)).toBe('1, 2, 3, 4, 5, 6');
  });

  it('handles values without label', () => {
    const values = [
      { id: 1, code: 'open' },
      { id: 2, code: 'closed' },
    ];
    expect(formatDimensionValues(values)).toBe('1, 2');
  });
});

describe('truncate', () => {
  it('returns string unchanged if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns string unchanged if exactly at limit', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates with ellipsis when over limit', () => {
    expect(truncate('hello world', 8)).toBe('hello w…');
  });

  it('handles very short max length', () => {
    expect(truncate('hello', 3)).toBe('hel');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});
