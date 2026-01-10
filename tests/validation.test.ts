import { describe, it, expect } from 'vitest';
import { validateSubdomain } from '../src/utils/validation.js';

describe('validateSubdomain', () => {
  it('should accept valid lowercase subdomain', () => {
    expect(validateSubdomain('myproject')).toBe(true);
  });

  it('should accept valid uppercase subdomain', () => {
    expect(validateSubdomain('MyProject')).toBe(true);
  });

  it('should accept subdomain with numbers', () => {
    expect(validateSubdomain('project123')).toBe(true);
  });

  it('should accept subdomain with hyphens', () => {
    expect(validateSubdomain('my-project')).toBe(true);
  });

  it('should accept subdomain with mixed case, numbers, and hyphens', () => {
    expect(validateSubdomain('My-Project-123')).toBe(true);
  });

  it('should throw error for empty subdomain', () => {
    expect(() => validateSubdomain('')).toThrow('Subdomain is required.');
  });

  it('should throw error for subdomain with underscores', () => {
    expect(() => validateSubdomain('my_project')).toThrow(
      'Invalid subdomain format. Use only letters, numbers, and hyphens.'
    );
  });

  it('should throw error for subdomain with spaces', () => {
    expect(() => validateSubdomain('my project')).toThrow(
      'Invalid subdomain format. Use only letters, numbers, and hyphens.'
    );
  });

  it('should throw error for subdomain with special characters', () => {
    expect(() => validateSubdomain('my@project')).toThrow(
      'Invalid subdomain format. Use only letters, numbers, and hyphens.'
    );
  });

  it('should throw error for subdomain with dots', () => {
    expect(() => validateSubdomain('my.project')).toThrow(
      'Invalid subdomain format. Use only letters, numbers, and hyphens.'
    );
  });
});
