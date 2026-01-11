import { describe, it, expect } from 'vitest';
import { slugify } from '../src/utils/slugify.js';

describe('slugify', () => {
  it('should convert spaces to dashes', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('should lowercase the text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should remove accents', () => {
    expect(slugify('café résumé')).toBe('cafe-resume');
    expect(slugify('naïve')).toBe('naive');
    expect(slugify('Ångström')).toBe('angstrom');
  });

  it('should replace special characters with dashes', () => {
    expect(slugify('hello, world!')).toBe('hello-world');
    expect(slugify('foo@bar#baz')).toBe('foo-bar-baz');
  });

  it('should collapse multiple dashes', () => {
    expect(slugify('hello   world')).toBe('hello-world');
    expect(slugify('foo---bar')).toBe('foo-bar');
  });

  it('should trim leading and trailing dashes', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
    expect(slugify('---hello---')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle complex titles', () => {
    expect(slugify('Fix: authentication bug (urgent!)')).toBe('fix-authentication-bug-urgent');
    expect(slugify("L'été est là")).toBe('l-ete-est-la');
  });
});
