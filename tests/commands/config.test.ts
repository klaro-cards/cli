import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/config.js', () => ({
  requireProject: vi.fn(),
}));

vi.mock('../../src/lib/defaults.js', () => ({
  setProjectDefault: vi.fn(),
  unsetProjectDefault: vi.fn(),
  listProjectDefaults: vi.fn(),
  getProjectDefaults: vi.fn(),
}));

import { requireProject } from '../../src/lib/config.js';
import {
  setProjectDefault,
  unsetProjectDefault,
  listProjectDefaults,
  getProjectDefaults,
} from '../../src/lib/defaults.js';
import { createConfigCommand } from '../../src/commands/config.js';

describe('config command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockSetProjectDefault = vi.mocked(setProjectDefault);
  const mockUnsetProjectDefault = vi.mocked(unsetProjectDefault);
  const mockListProjectDefaults = vi.mocked(listProjectDefaults);
  const mockGetProjectDefaults = vi.mocked(getProjectDefaults);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('config set', () => {
    it('should set a default value for current project', async () => {
      mockRequireProject.mockReturnValue('myproject');

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'set', 'board', 'backlog']);

      expect(mockRequireProject).toHaveBeenCalledWith(undefined);
      expect(mockSetProjectDefault).toHaveBeenCalledWith('myproject', 'board', 'backlog');
      expect(consoleSpy).toHaveBeenCalledWith('Set default board="backlog" for project "myproject"');
    });

    it('should use custom project from option', async () => {
      mockRequireProject.mockReturnValue('custom-project');

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'set', 'board', 'sprint', '-p', 'custom-project']);

      expect(mockRequireProject).toHaveBeenCalledWith('custom-project');
      expect(mockSetProjectDefault).toHaveBeenCalledWith('custom-project', 'board', 'sprint');
    });

    it('should error if no project is set', async () => {
      mockRequireProject.mockImplementation(() => {
        throw new Error('No project specified');
      });

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'set', 'board', 'backlog']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('No project specified');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should error for unknown option key', async () => {
      mockRequireProject.mockReturnValue('myproject');

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'set', 'unknownkey', 'value']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Unknown option "unknownkey". Valid options: board');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockSetProjectDefault).not.toHaveBeenCalled();
    });
  });

  describe('config unset', () => {
    it('should remove a default value for current project', async () => {
      mockRequireProject.mockReturnValue('myproject');

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'unset', 'board']);

      expect(mockRequireProject).toHaveBeenCalledWith(undefined);
      expect(mockUnsetProjectDefault).toHaveBeenCalledWith('myproject', 'board');
      expect(consoleSpy).toHaveBeenCalledWith('Removed default for "board" from project "myproject"');
    });

    it('should error if no project is set', async () => {
      mockRequireProject.mockImplementation(() => {
        throw new Error('No project specified');
      });

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'unset', 'board']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('No project specified');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should error for unknown option key', async () => {
      mockRequireProject.mockReturnValue('myproject');

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'unset', 'unknownkey']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Unknown option "unknownkey". Valid options: board');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockUnsetProjectDefault).not.toHaveBeenCalled();
    });
  });

  describe('config list', () => {
    it('should list all defaults for current project', async () => {
      mockRequireProject.mockReturnValue('myproject');
      mockListProjectDefaults.mockReturnValue({ board: 'backlog' });
      mockGetProjectDefaults.mockReturnValue({ board: 'backlog' });

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'list']);

      expect(mockRequireProject).toHaveBeenCalledWith(undefined);
      expect(consoleSpy).toHaveBeenCalledWith('Defaults for project "myproject":\n');
      expect(consoleSpy).toHaveBeenCalledWith('  board: backlog (configured)');
    });

    it('should show source as (default) for non-configured values', async () => {
      mockRequireProject.mockReturnValue('myproject');
      mockListProjectDefaults.mockReturnValue({ board: 'all' });
      mockGetProjectDefaults.mockReturnValue({});

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'list']);

      expect(consoleSpy).toHaveBeenCalledWith('  board: all (default)');
    });

    it('should error if no project is set', async () => {
      mockRequireProject.mockImplementation(() => {
        throw new Error('No project specified');
      });

      const cmd = createConfigCommand();
      await cmd.parseAsync(['node', 'test', 'list']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('No project specified');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
