import { describe, it, expect } from 'vitest';
import { formatTable } from '../src/utils/table.js';

describe('formatTable', () => {
  it('formats data with specified columns', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ];
    const result = formatTable(data, ['id', 'name']);

    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).toContain('1');
    expect(result).toContain('2');
    // Should not include age column
    expect(result).not.toContain('30');
    expect(result).not.toContain('25');
  });

  it('handles empty data array', () => {
    const result = formatTable([], ['id', 'name']);
    // Empty data returns empty table structure
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('handles single row', () => {
    const data = [{ code: 'test', value: 123 }];
    const result = formatTable(data, ['code', 'value']);

    expect(result).toContain('test');
    expect(result).toContain('123');
  });

  it('handles missing columns gracefully', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2 }, // missing name
    ];
    const result = formatTable(data, ['id', 'name']);

    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('Alice');
  });
});
