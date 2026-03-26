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
import {
  getConfigPath,
  getSecretsPath,
  isUsingLocalConfig,
  readConfig,
  writeConfig,
  getProject,
  getProjectOrDefault,
  requireProject,
  requireToken,
} from '../src/lib/config.js';

describe('config', () => {
  const mockExistsSync = vi.mocked(existsSync);
  const mockReadFileSync = vi.mocked(readFileSync);
  const mockWriteFileSync = vi.mocked(writeFileSync);
  const mockMkdirSync = vi.mocked(mkdirSync);

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.KLARO_HOME;
    // Default: no local .klaro directory
    mockExistsSync.mockImplementation((path) => {
      if (typeof path === 'string' && path.includes(process.cwd())) {
        return false;
      }
      return false;
    });
  });

  afterEach(() => {
    delete process.env.KLARO_HOME;
  });

  describe('getConfigPath', () => {
    it('should return path in home directory when no local .klaro exists', () => {
      const path = getConfigPath();
      expect(path).toBe(join(homedir(), '.klaro', 'config.json'));
    });

    it('should use KLARO_HOME when set', () => {
      process.env.KLARO_HOME = '/custom/home';
      const path = getConfigPath();
      expect(path).toBe(join('/custom/home', '.klaro', 'config.json'));
    });

    it('should use local .klaro when it exists', () => {
      mockExistsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path === join(process.cwd(), '.klaro')) {
          return true;
        }
        return false;
      });
      const path = getConfigPath();
      expect(path).toBe(join(process.cwd(), '.klaro', 'config.json'));
    });
  });

  describe('getSecretsPath', () => {
    it('should return secrets.json path in config directory', () => {
      const path = getSecretsPath();
      expect(path).toBe(join(homedir(), '.klaro', 'secrets.json'));
    });
  });

  describe('isUsingLocalConfig', () => {
    it('should return false when no local .klaro exists', () => {
      expect(isUsingLocalConfig()).toBe(false);
    });

    it('should return true when local .klaro exists', () => {
      mockExistsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path === join(process.cwd(), '.klaro')) {
          return true;
        }
        return false;
      });
      expect(isUsingLocalConfig()).toBe(true);
    });
  });

  describe('readConfig', () => {
    it('should return empty object if no config files exist', () => {
      mockExistsSync.mockReturnValue(false);
      const config = readConfig();
      expect(config).toEqual({});
    });

    it('should return config from config.json only', () => {
      mockExistsSync.mockImplementation((path) => {
        return typeof path === 'string' && path.endsWith('config.json');
      });
      mockReadFileSync.mockReturnValue('{"project":"myproject"}');

      const config = readConfig();
      expect(config).toEqual({ project: 'myproject' });
    });

    it('should return token from secrets.json only', () => {
      mockExistsSync.mockImplementation((path) => {
        return typeof path === 'string' && path.endsWith('secrets.json');
      });
      mockReadFileSync.mockReturnValue('{"token":"abc123"}');

      const config = readConfig();
      expect(config).toEqual({ token: 'abc123' });
    });

    it('should merge config.json and secrets.json', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('config.json')) {
          return '{"project":"myproject","email":"test@example.com"}';
        }
        if (typeof path === 'string' && path.endsWith('secrets.json')) {
          return '{"token":"abc123"}';
        }
        return '{}';
      });

      const config = readConfig();
      expect(config).toEqual({
        project: 'myproject',
        email: 'test@example.com',
        token: 'abc123',
      });
    });

    it('should return empty object if JSON is invalid', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json');

      const config = readConfig();
      expect(config).toEqual({});
    });

    it('should deep merge nested objects like projectDefaults', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('config.json')) {
          return '{"project":"myproject","projectDefaults":{"proj1":{"board":"backlog"}}}';
        }
        if (typeof path === 'string' && path.endsWith('secrets.json')) {
          return '{"token":"abc123"}';
        }
        return '{}';
      });

      const config = readConfig();
      expect(config).toEqual({
        project: 'myproject',
        projectDefaults: { proj1: { board: 'backlog' } },
        token: 'abc123',
      });
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

    it('should write config.json without token', () => {
      // Local .klaro doesn't exist, global dir exists
      mockExistsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path === join(process.cwd(), '.klaro')) {
          return false;
        }
        return true;
      });

      writeConfig({ token: 'abc', project: 'test' });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(homedir(), '.klaro', 'config.json'),
        JSON.stringify({ project: 'test' }, null, 2),
        'utf-8'
      );
    });

    it('should write secrets.json with token', () => {
      // Local .klaro doesn't exist, global dir exists
      mockExistsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path === join(process.cwd(), '.klaro')) {
          return false;
        }
        return true;
      });

      writeConfig({ token: 'abc', project: 'test' });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(homedir(), '.klaro', 'secrets.json'),
        JSON.stringify({ token: 'abc' }, null, 2),
        'utf-8'
      );
    });

    it('should not write secrets.json if no token and file does not exist', () => {
      mockExistsSync.mockImplementation((path) => {
        // Local .klaro doesn't exist
        if (typeof path === 'string' && path === join(process.cwd(), '.klaro')) {
          return false;
        }
        // secrets.json does not exist
        if (typeof path === 'string' && path.endsWith('secrets.json')) {
          return false;
        }
        return true;
      });

      writeConfig({ project: 'test' });

      const secretsWriteCall = mockWriteFileSync.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].endsWith('secrets.json')
      );
      expect(secretsWriteCall).toBeUndefined();
    });

    it('should write to local .klaro when it exists', () => {
      mockExistsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path === join(process.cwd(), '.klaro')) {
          return true;
        }
        return true;
      });

      writeConfig({ token: 'abc', project: 'test' });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(process.cwd(), '.klaro', 'config.json'),
        JSON.stringify({ project: 'test' }, null, 2),
        'utf-8'
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(process.cwd(), '.klaro', 'secrets.json'),
        JSON.stringify({ token: 'abc' }, null, 2),
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
      mockReadFileSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('config.json')) {
          return '{"project":"config-project"}';
        }
        return '{}';
      });

      const project = getProject();
      expect(project).toBe('config-project');
    });

    it('should return undefined if no project set', () => {
      mockExistsSync.mockReturnValue(false);

      const project = getProject();
      expect(project).toBeUndefined();
    });
  });

  describe('getProjectOrDefault', () => {
    it('should return CLI option if provided', () => {
      expect(getProjectOrDefault('cli-project')).toBe('cli-project');
    });

    it('should return config project if no CLI option', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('config.json')) {
          return '{"project":"config-project"}';
        }
        return '{}';
      });

      expect(getProjectOrDefault()).toBe('config-project');
    });

    it('should return "app" fallback if no project set', () => {
      mockExistsSync.mockReturnValue(false);
      expect(getProjectOrDefault()).toBe('app');
    });

    it('should return custom fallback if provided', () => {
      mockExistsSync.mockReturnValue(false);
      expect(getProjectOrDefault(undefined, 'custom')).toBe('custom');
    });
  });

  describe('requireProject', () => {
    it('should return project if available', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('config.json')) {
          return '{"project":"myproject"}';
        }
        return '{}';
      });

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
      mockReadFileSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('secrets.json')) {
          return '{"token":"abc123"}';
        }
        return '{}';
      });

      const token = requireToken();
      expect(token).toBe('abc123');
    });

    it('should throw error if not logged in', () => {
      mockExistsSync.mockReturnValue(false);

      expect(() => requireToken()).toThrow(/Not logged in/);
    });
  });
});
