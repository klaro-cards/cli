import { describe, it, expect } from 'vitest';
import { parseDimensions } from '../src/utils/dimensions.js';

describe('parseDimensions', () => {
  it('should return empty object for undefined input', () => {
    const result = parseDimensions(undefined);
    expect(result).toEqual({});
  });

  it('should return empty object for empty array', () => {
    const result = parseDimensions([]);
    expect(result).toEqual({});
  });

  it('should parse a single dimension', () => {
    const result = parseDimensions(['progress=todo']);
    expect(result).toEqual({ progress: 'todo' });
  });

  it('should parse multiple dimensions', () => {
    const result = parseDimensions(['progress=todo', 'priority=high']);
    expect(result).toEqual({ progress: 'todo', priority: 'high' });
  });

  it('should handle values with equals sign', () => {
    const result = parseDimensions(['formula=a=b+c']);
    expect(result).toEqual({ formula: 'a=b+c' });
  });

  it('should handle empty values', () => {
    const result = parseDimensions(['key=']);
    expect(result).toEqual({ key: '' });
  });

  it('should throw error for invalid format (missing equals)', () => {
    expect(() => parseDimensions(['invalid'])).toThrow(
      'Invalid dimension format: "invalid". Expected format: key=value'
    );
  });

  it('should throw error for first invalid dimension in array', () => {
    expect(() => parseDimensions(['valid=ok', 'invalid', 'also=ok'])).toThrow(
      'Invalid dimension format: "invalid". Expected format: key=value'
    );
  });
});
