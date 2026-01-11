import { describe, it, expect } from 'vitest';
import { deepMerge } from '../src/utils/objects.js';

describe('deepMerge', () => {
  it('merges simple objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('does not mutate original objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3 };
    deepMerge(target, source);

    expect(target).toEqual({ a: 1, b: 2 });
    expect(source).toEqual({ b: 3 });
  });

  it('merges nested objects recursively', () => {
    const target = {
      outer: {
        inner: { a: 1, b: 2 },
        other: 'keep',
      },
    };
    const source = {
      outer: {
        inner: { b: 3, c: 4 },
      },
    };
    const result = deepMerge(target, source);

    expect(result).toEqual({
      outer: {
        inner: { a: 1, b: 3, c: 4 },
        other: 'keep',
      },
    });
  });

  it('replaces arrays instead of merging', () => {
    const target = { items: [1, 2, 3] };
    const source = { items: [4, 5] };
    const result = deepMerge(target, source);

    expect(result).toEqual({ items: [4, 5] });
  });

  it('replaces null values', () => {
    const target = { a: { nested: true } };
    const source = { a: null as unknown as { nested: boolean } };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: null });
  });

  it('ignores undefined values in source', () => {
    const target = { a: 1, b: 2 };
    const source = { a: undefined, b: 3 };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: 3 });
  });

  it('handles empty source', () => {
    const target = { a: 1, b: 2 };
    const result = deepMerge(target, {});

    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('handles empty target', () => {
    const target = {};
    const source = { a: 1, b: 2 };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('merges deeply nested structures', () => {
    const target = {
      level1: {
        level2: {
          level3: {
            a: 1,
            b: 2,
          },
        },
      },
    };
    const source = {
      level1: {
        level2: {
          level3: {
            b: 3,
            c: 4,
          },
        },
      },
    };
    const result = deepMerge(target, source);

    expect(result).toEqual({
      level1: {
        level2: {
          level3: {
            a: 1,
            b: 3,
            c: 4,
          },
        },
      },
    });
  });

  it('replaces primitive with object', () => {
    const target = { a: 'string' as unknown as { nested: boolean } };
    const source = { a: { nested: true } };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: { nested: true } });
  });

  it('replaces object with primitive', () => {
    const target = { a: { nested: true } };
    const source = { a: 'string' as unknown as { nested: boolean } };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 'string' });
  });
});
