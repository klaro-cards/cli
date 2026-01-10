import { describe, it, expect } from 'vitest';
import { formatTable } from '../src/utils/table.js';

describe('table', () => {
  describe('formatTable', () => {
    it('should return "No items found." for empty array', () => {
      const result = formatTable([], [{ header: 'Test', key: 'test' }]);
      expect(result).toBe('No items found.');
    });

    it('should format a simple table', () => {
      const rows = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ];
      const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name' },
      ];

      const result = formatTable(rows, columns);

      // Check table structure contains key elements
      expect(result).toContain('ID');
      expect(result).toContain('Name');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('+'); // separator
      expect(result).toContain('|'); // column delimiter
    });

    it('should handle custom column widths', () => {
      const rows = [{ id: '1' }];
      const columns = [{ header: 'ID', key: 'id', width: 10 }];

      const result = formatTable(rows, columns);

      expect(result).toContain('| ID         |');
    });

    it('should handle right alignment', () => {
      const rows = [{ value: '42' }];
      const columns = [{ header: 'Value', key: 'value', width: 10, align: 'right' as const }];

      const result = formatTable(rows, columns);

      expect(result).toContain('|         42 |');
    });

    it('should handle missing values', () => {
      const rows = [{ id: '1' }];
      const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name' },
      ];

      const result = formatTable(rows, columns);

      // Verify table contains the ID and has proper structure
      expect(result).toContain('1');
      expect(result).toContain('ID');
      expect(result).toContain('Name');
      // The empty cell should still be present with proper formatting
      expect(result.split('\n').length).toBeGreaterThan(3);
    });
  });
});
