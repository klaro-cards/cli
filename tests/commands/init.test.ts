import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { homedir } from 'node:os';

// Mock the fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock readline
vi.mock('node:readline', () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn((_, callback) => callback('1')),
    close: vi.fn(),
  })),
}));

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createInitCommand } from '../../src/commands/init.js';

describe('init command', () => {
  const mockExistsSync = vi.mocked(existsSync);
  const mockMkdirSync = vi.mocked(mkdirSync);
  const mockWriteFileSync = vi.mocked(writeFileSync);
  const mockReadFileSync = vi.mocked(readFileSync);
  const mockCreateInterface = vi.mocked(createInterface);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.KLARO_HOME;
  });

  afterEach(() => {
    delete process.env.KLARO_HOME;
  });

  describe('init .', () => {
    it('should create .klaro in current directory', async () => {
      mockExistsSync.mockImplementation((path) => {
        // Current directory exists
        if (path === process.cwd()) return true;
        // .klaro doesn't exist yet
        return false;
      });

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test', '.']);

      const expectedDir = join(process.cwd(), '.klaro');
      expect(mockMkdirSync).toHaveBeenCalledWith(expectedDir, { recursive: true });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(expectedDir, 'config.json'),
        JSON.stringify({}, null, 2),
        'utf-8'
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initialized local config'));
    });

    it('should set project when -p is specified', async () => {
      mockExistsSync.mockImplementation((path) => {
        if (path === process.cwd()) return true;
        return false;
      });

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test', '.', '-p', 'myproject']);

      const expectedDir = join(process.cwd(), '.klaro');
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(expectedDir, 'config.json'),
        JSON.stringify({ project: 'myproject' }, null, 2),
        'utf-8'
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('myproject'));
    });
  });

  describe('init FOLDER', () => {
    it('should create .klaro in specified folder', async () => {
      mockExistsSync.mockImplementation((path) => {
        // Target folder exists
        if (typeof path === 'string' && path.endsWith('some-folder')) return true;
        return false;
      });

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test', 'some-folder']);

      expect(mockMkdirSync).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initialized local config'));
    });

    it('should error if folder does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test', 'nonexistent-folder']);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('init (interactive)', () => {
    it('should inform if global config already exists', async () => {
      mockExistsSync.mockImplementation((path) => {
        // Global .klaro exists
        if (typeof path === 'string' && path === join(homedir(), '.klaro')) return true;
        return false;
      });

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Global config already exists'));
    });

    it('should update project in global config when -p specified and global exists', async () => {
      mockExistsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path === join(homedir(), '.klaro')) return true;
        if (typeof path === 'string' && path.endsWith('config.json')) return true;
        return false;
      });
      mockReadFileSync.mockReturnValue('{}');

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test', '-p', 'newproject']);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(homedir(), '.klaro', 'config.json'),
        JSON.stringify({ project: 'newproject' }, null, 2),
        'utf-8'
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('newproject'));
    });

    it('should create global config when user chooses 1', async () => {
      mockExistsSync.mockReturnValue(false);
      mockCreateInterface.mockReturnValue({
        question: vi.fn((_, callback) => callback('1')),
        close: vi.fn(),
      } as any);

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(homedir(), '.klaro'),
        { recursive: true }
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('global config'));
    });

    it('should create local config when user chooses 2', async () => {
      mockExistsSync.mockReturnValue(false);
      mockCreateInterface.mockReturnValue({
        question: vi.fn((_, callback) => callback('2')),
        close: vi.fn(),
      } as any);

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), '.klaro'),
        { recursive: true }
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('local config'));
    });

    it('should error on invalid choice', async () => {
      mockExistsSync.mockReturnValue(false);
      mockCreateInterface.mockReturnValue({
        question: vi.fn((_, callback) => callback('invalid')),
        close: vi.fn(),
      } as any);

      const cmd = createInitCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid choice'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
