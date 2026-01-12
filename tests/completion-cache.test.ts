import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Set up test environment before importing module
const testDir = mkdtempSync(join(tmpdir(), 'klaro-completion-test-'));
process.env.KLARO_HOME = testDir;

import {
  readCompletionCache,
  writeCompletionCache,
  getCachedProjects,
  getCachedBoards,
  setCachedProjects,
  setCachedBoards,
  needsProjectsRefresh,
  needsBoardsRefresh,
} from '../src/lib/completion-cache.js';

describe('completion-cache', () => {
  beforeEach(() => {
    // Clean cache file before each test
    const cacheFile = join(testDir, '.klaro', 'completion-cache.json');
    if (existsSync(cacheFile)) {
      rmSync(cacheFile);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readCompletionCache', () => {
    it('returns empty object when cache file does not exist', () => {
      const cache = readCompletionCache();
      expect(cache).toEqual({});
    });

    it('reads existing cache file', () => {
      const cacheDir = join(testDir, '.klaro');
      const cacheFile = join(cacheDir, 'completion-cache.json');
      mkdirSync(cacheDir, { recursive: true });
      const data = {
        projects: {
          data: [{ subdomain: 'test', label: 'Test' }],
          timestamp: Date.now(),
        },
      };
      writeFileSync(cacheFile, JSON.stringify(data), 'utf-8');

      const cache = readCompletionCache();
      expect(cache.projects?.data).toEqual([{ subdomain: 'test', label: 'Test' }]);
    });
  });

  describe('writeCompletionCache', () => {
    it('creates cache directory and file', () => {
      writeCompletionCache({
        projects: {
          data: [{ subdomain: 'proj1', label: 'Project 1' }],
          timestamp: Date.now(),
        },
      });

      const cacheFile = join(testDir, '.klaro', 'completion-cache.json');
      expect(existsSync(cacheFile)).toBe(true);
    });
  });

  describe('getCachedProjects / setCachedProjects', () => {
    it('returns empty array when no cache', () => {
      expect(getCachedProjects()).toEqual([]);
    });

    it('returns cached project subdomains', () => {
      setCachedProjects([
        { subdomain: 'proj1', label: 'Project 1' },
        { subdomain: 'proj2', label: 'Project 2' },
      ]);

      const projects = getCachedProjects();
      expect(projects).toEqual(['proj1', 'proj2']);
    });

    it('returns empty array when cache is stale', () => {
      // Write cache with old timestamp
      writeCompletionCache({
        projects: {
          data: [{ subdomain: 'old', label: 'Old' }],
          timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        },
      });

      expect(getCachedProjects()).toEqual([]);
    });
  });

  describe('getCachedBoards / setCachedBoards', () => {
    it('returns empty array when no cache', () => {
      expect(getCachedBoards('myproject')).toEqual([]);
    });

    it('returns cached board identifiers', () => {
      setCachedBoards('myproject', [
        { identifier: 'backlog', label: 'Backlog' },
        { identifier: 'kanban', label: 'Kanban' },
      ]);

      const boards = getCachedBoards('myproject');
      expect(boards).toEqual(['backlog', 'kanban']);
    });

    it('returns empty array for different project', () => {
      setCachedBoards('proj1', [{ identifier: 'board1', label: 'Board 1' }]);

      expect(getCachedBoards('proj2')).toEqual([]);
    });
  });

  describe('needsProjectsRefresh / needsBoardsRefresh', () => {
    it('returns true when no cache', () => {
      expect(needsProjectsRefresh()).toBe(true);
      expect(needsBoardsRefresh('myproject')).toBe(true);
    });

    it('returns false when cache is fresh', () => {
      setCachedProjects([{ subdomain: 'test', label: 'Test' }]);
      setCachedBoards('myproject', [{ identifier: 'board', label: 'Board' }]);

      expect(needsProjectsRefresh()).toBe(false);
      expect(needsBoardsRefresh('myproject')).toBe(false);
    });

    it('returns true when cache is stale', () => {
      writeCompletionCache({
        projects: {
          data: [{ subdomain: 'old', label: 'Old' }],
          timestamp: Date.now() - 2 * 60 * 60 * 1000,
        },
        boards: {
          myproject: {
            data: [{ identifier: 'old', label: 'Old' }],
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
          },
        },
      });

      expect(needsProjectsRefresh()).toBe(true);
      expect(needsBoardsRefresh('myproject')).toBe(true);
    });
  });
});
