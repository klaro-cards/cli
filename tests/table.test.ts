import { describe, it, expect } from 'vitest';
import { formatTable } from '../src/utils/table.js';

describe('table', () => {
  describe('formatTable', () => {
    it('should return "No items found." for empty array', () => {
      const result = formatTable([]);
      expect(result).toBe('No items found.');
    });

    it('should format a simple table', () => {
      const rows = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ];

      const result = formatTable(rows);

      expect(result).toContain('id');
      expect(result).toContain('name');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('+'); // separator
      expect(result).toContain('|'); // column delimiter
    });

    it('should use object keys as column headers', () => {
      const rows = [{ ID: '1', Name: 'Alice' }];

      const result = formatTable(rows);

      expect(result).toContain('| ID |');
      expect(result).toContain('| Name  |');
    });
  });
});
