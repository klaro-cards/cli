import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

import { readConfig, writeConfig } from '../src/lib/config.js';
import {
  getProjectDefaults,
  setProjectDefault,
  unsetProjectDefault,
  resolveOption,
  resolveBoard,
  listProjectDefaults,
} from '../src/lib/defaults.js';

describe('defaults', () => {
  const mockReadConfig = vi.mocked(readConfig);
  const mockWriteConfig = vi.mocked(writeConfig);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjectDefaults', () => {
    it('should return empty object if no projectDefaults in config', () => {
      mockReadConfig.mockReturnValue({});
      expect(getProjectDefaults('myproject')).toEqual({});
    });

    it('should return empty object if project not found in projectDefaults', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: {
          otherproject: { board: 'backlog' },
        },
      });
      expect(getProjectDefaults('myproject')).toEqual({});
    });

    it('should return project defaults when they exist', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: {
          myproject: { board: 'backlog' },
        },
      });
      expect(getProjectDefaults('myproject')).toEqual({ board: 'backlog' });
    });
  });

  describe('resolveOption', () => {
    it('should return CLI value when provided (highest priority)', () => {
      const result = resolveOption('cli-board', { board: 'config-board' }, 'board');
      expect(result).toBe('cli-board');
    });

    it('should return project config value when CLI is undefined', () => {
      const result = resolveOption(undefined, { board: 'config-board' }, 'board');
      expect(result).toBe('config-board');
    });

    it('should return hardcoded default when both CLI and config are undefined', () => {
      const result = resolveOption(undefined, {}, 'board');
      expect(result).toBe('all');
    });
  });

  describe('resolveBoard', () => {
    it('should return CLI board when provided', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: { myproject: { board: 'custom' } },
      });
      expect(resolveBoard('cli-board', 'myproject')).toBe('cli-board');
    });

    it('should return project default board when CLI is undefined', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: { myproject: { board: 'custom' } },
      });
      expect(resolveBoard(undefined, 'myproject')).toBe('custom');
    });

    it("should return 'all' when no CLI or project default exists", () => {
      mockReadConfig.mockReturnValue({});
      expect(resolveBoard(undefined, 'myproject')).toBe('all');
    });
  });

  describe('setProjectDefault', () => {
    it('should create projectDefaults structure if missing', () => {
      mockReadConfig.mockReturnValue({});
      setProjectDefault('myproject', 'board', 'backlog');

      expect(mockWriteConfig).toHaveBeenCalledWith({
        projectDefaults: {
          myproject: { board: 'backlog' },
        },
      });
    });

    it('should create project entry if missing', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: {
          otherproject: { board: 'sprint' },
        },
      });
      setProjectDefault('myproject', 'board', 'backlog');

      expect(mockWriteConfig).toHaveBeenCalledWith({
        projectDefaults: {
          otherproject: { board: 'sprint' },
          myproject: { board: 'backlog' },
        },
      });
    });

    it('should add key to existing project defaults', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: {
          myproject: {},
        },
      });
      setProjectDefault('myproject', 'board', 'backlog');

      expect(mockWriteConfig).toHaveBeenCalledWith({
        projectDefaults: {
          myproject: { board: 'backlog' },
        },
      });
    });

    it('should overwrite existing key value', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: {
          myproject: { board: 'old-board' },
        },
      });
      setProjectDefault('myproject', 'board', 'new-board');

      expect(mockWriteConfig).toHaveBeenCalledWith({
        projectDefaults: {
          myproject: { board: 'new-board' },
        },
      });
    });
  });

  describe('unsetProjectDefault', () => {
    it('should remove key from project defaults', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: {
          myproject: { board: 'backlog' },
          otherproject: { board: 'sprint' },
        },
      });
      unsetProjectDefault('myproject', 'board');

      expect(mockWriteConfig).toHaveBeenCalledWith({
        projectDefaults: {
          otherproject: { board: 'sprint' },
        },
      });
    });

    it('should clean up empty project object', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: {
          myproject: { board: 'backlog' },
        },
      });
      unsetProjectDefault('myproject', 'board');

      expect(mockWriteConfig).toHaveBeenCalledWith({});
    });

    it('should clean up empty projectDefaults object', () => {
      mockReadConfig.mockReturnValue({
        token: 'abc',
        projectDefaults: {
          myproject: { board: 'backlog' },
        },
      });
      unsetProjectDefault('myproject', 'board');

      expect(mockWriteConfig).toHaveBeenCalledWith({ token: 'abc' });
    });

    it("should do nothing if key doesn't exist", () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: {
          myproject: {},
        },
      });
      unsetProjectDefault('myproject', 'board');

      expect(mockWriteConfig).not.toHaveBeenCalled();
    });
  });

  describe('listProjectDefaults', () => {
    it('should merge hardcoded defaults with project defaults', () => {
      mockReadConfig.mockReturnValue({});
      const result = listProjectDefaults('myproject');
      expect(result).toEqual({ board: 'all' });
    });

    it('should let project defaults override hardcoded defaults', () => {
      mockReadConfig.mockReturnValue({
        projectDefaults: { myproject: { board: 'custom' } },
      });
      const result = listProjectDefaults('myproject');
      expect(result).toEqual({ board: 'custom' });
    });
  });
});
