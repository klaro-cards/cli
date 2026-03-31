import { describe, it, expect } from 'vitest';
import { parseDimensions, splitArgs } from '../src/utils/dimensions.js';

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

  it('should collect repeated keys into an array', () => {
    const result = parseDimensions(['see_also=137', 'see_also=138', 'see_also=139']);
    expect(result).toEqual({ see_also: ['137', '138', '139'] });
  });

  it('should keep single values as strings not arrays', () => {
    const result = parseDimensions(['see_also=137', 'progress=todo']);
    expect(result).toEqual({ see_also: '137', progress: 'todo' });
  });

  it('should handle two repeated keys as an array', () => {
    const result = parseDimensions(['tag=a', 'tag=b']);
    expect(result).toEqual({ tag: ['a', 'b'] });
  });
});

describe('splitArgs', () => {
  it('should return empty arrays for empty input', () => {
    const result = splitArgs([]);
    expect(result).toEqual({ regularArgs: [], dimensionArgs: [] });
  });

  it('should separate regular args from key=value args', () => {
    const result = splitArgs(['12', '13', 'status=done']);
    expect(result).toEqual({
      regularArgs: ['12', '13'],
      dimensionArgs: ['status=done'],
    });
  });

  it('should handle multiple key=value args', () => {
    const result = splitArgs(['1', 'status=done', 'assignee=Claude']);
    expect(result).toEqual({
      regularArgs: ['1'],
      dimensionArgs: ['status=done', 'assignee=Claude'],
    });
  });

  it('should handle only regular args', () => {
    const result = splitArgs(['1', '2', '3']);
    expect(result).toEqual({
      regularArgs: ['1', '2', '3'],
      dimensionArgs: [],
    });
  });

  it('should handle only key=value args', () => {
    const result = splitArgs(['status=done', 'priority=high']);
    expect(result).toEqual({
      regularArgs: [],
      dimensionArgs: ['status=done', 'priority=high'],
    });
  });

  it('should preserve order for key=value args with = in value', () => {
    const result = splitArgs(['title', 'formula=a=b+c']);
    expect(result).toEqual({
      regularArgs: ['title'],
      dimensionArgs: ['formula=a=b+c'],
    });
  });
});
