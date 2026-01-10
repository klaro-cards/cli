import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Mock the fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { getConfigPath, readConfig, writeConfig, getProject, requireProject, requireToken } from '../src/lib/config.js';

describe('config', () => {
  const mockExistsSync = vi.mocked(existsSync);
  const mockReadFileSync = vi.mocked(readFileSync);
  const mockWriteFileSync = vi.mocked(writeFileSync);
  const mockMkdirSync = vi.mocked(mkdirSync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfigPath', () => {
    it('should return path in home directory', () => {
      const path = getConfigPath();
      expect(path).toBe(join(homedir(), '.klaro', 'config.json'));
    });
  });

  describe('readConfig', () => {
    it('should return empty object if config file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      const config = readConfig();
      expect(config).toEqual({});
    });

    it('should return parsed config if file exists', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{"token":"abc123","project":"myproject"}');

      const config = readConfig();
      expect(config).toEqual({ token: 'abc123', project: 'myproject' });
    });

    it('should return empty object if JSON is invalid', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json');

      const config = readConfig();
      expect(config).toEqual({});
    });
  });

  describe('writeConfig', () => {
    it('should create directory if it does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      writeConfig({ token: 'abc', project: 'test' });

      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(homedir(), '.klaro'),
        { recursive: true }
      );
    });

    it('should write config to file', () => {
      mockExistsSync.mockReturnValue(true);

      writeConfig({ token: 'abc', project: 'test' });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(homedir(), '.klaro', 'config.json'),
        JSON.stringify({ token: 'abc', project: 'test' }, null, 2),
        'utf-8'
      );
    });
  });

  describe('getProject', () => {
    it('should return CLI option if provided', () => {
      const project = getProject('cli-project');
      expect(project).toBe('cli-project');
    });

    it('should return config project if no CLI option', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{"project":"config-project"}');

      const project = getProject();
      expect(project).toBe('config-project');
    });

    it('should return undefined if no project set', () => {
      mockExistsSync.mockReturnValue(false);

      const project = getProject();
      expect(project).toBeUndefined();
    });
  });

  describe('requireProject', () => {
    it('should return project if available', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{"project":"myproject"}');

      const project = requireProject();
      expect(project).toBe('myproject');
    });

    it('should throw error if no project', () => {
      mockExistsSync.mockReturnValue(false);

      expect(() => requireProject()).toThrow(/No project specified/);
    });
  });

  describe('requireToken', () => {
    it('should return token if available', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{"token":"abc123"}');

      const token = requireToken();
      expect(token).toBe('abc123');
    });

    it('should throw error if not logged in', () => {
      mockExistsSync.mockReturnValue(false);

      expect(() => requireToken()).toThrow(/Not logged in/);
    });
  });
});
