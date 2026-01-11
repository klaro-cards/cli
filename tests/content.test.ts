import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';

// Mock the fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
}));

// Mock the config module
vi.mock('../src/lib/config.js', () => ({
  getConfigDir: vi.fn(),
}));

import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { getConfigDir } from '../src/lib/config.js';
import {
  getContentDir,
  ensureContentDir,
  listContentFiles,
  extractIdentifierFromFilename,
  buildContentFilename,
} from '../src/utils/content.js';

describe('content utilities', () => {
  const mockExistsSync = vi.mocked(existsSync);
  const mockMkdirSync = vi.mocked(mkdirSync);
  const mockReaddirSync = vi.mocked(readdirSync);
  const mockGetConfigDir = vi.mocked(getConfigDir);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfigDir.mockReturnValue('/home/user/.klaro');
  });

  describe('getContentDir', () => {
    it('should return content directory path for project', () => {
      const dir = getContentDir('myproject');
      expect(dir).toBe(join('/home/user/.klaro', 'content', 'myproject'));
    });
  });

  describe('ensureContentDir', () => {
    it('should create directory if it does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const dir = ensureContentDir('myproject');

      expect(mockMkdirSync).toHaveBeenCalledWith(
        join('/home/user/.klaro', 'content', 'myproject'),
        { recursive: true }
      );
      expect(dir).toBe(join('/home/user/.klaro', 'content', 'myproject'));
    });

    it('should not create directory if it already exists', () => {
      mockExistsSync.mockReturnValue(true);

      ensureContentDir('myproject');

      expect(mockMkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('listContentFiles', () => {
    it('should return empty array if directory does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const files = listContentFiles('myproject');

      expect(files).toEqual([]);
    });

    it('should return only .md files', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        '1-my-card.md',
        '2-another-card.md',
        'notes.txt',
        '.gitignore',
      ] as unknown as ReturnType<typeof readdirSync>);

      const files = listContentFiles('myproject');

      expect(files).toEqual(['1-my-card.md', '2-another-card.md']);
    });
  });

  describe('extractIdentifierFromFilename', () => {
    it('should extract identifier from valid filename', () => {
      expect(extractIdentifierFromFilename('12-my-card-title.md')).toBe(12);
      expect(extractIdentifierFromFilename('1-a.md')).toBe(1);
      expect(extractIdentifierFromFilename('999-long-title-here.md')).toBe(999);
    });

    it('should return null for invalid filenames', () => {
      expect(extractIdentifierFromFilename('my-card.md')).toBeNull();
      expect(extractIdentifierFromFilename('abc-123.md')).toBeNull();
      expect(extractIdentifierFromFilename('12.md')).toBeNull();
      expect(extractIdentifierFromFilename('12-card.txt')).toBeNull();
    });
  });

  describe('buildContentFilename', () => {
    it('should build filename from identifier and title', () => {
      expect(buildContentFilename(12, 'My Card Title')).toBe('12-my-card-title.md');
      expect(buildContentFilename('5', 'Test')).toBe('5-test.md');
    });

    it('should handle special characters in title', () => {
      expect(buildContentFilename(1, 'Fix: bug #123')).toBe('1-fix-bug-123.md');
      expect(buildContentFilename(2, 'Café résumé')).toBe('2-cafe-resume.md');
    });
  });
});
