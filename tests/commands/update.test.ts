import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('../../src/lib/config.js', () => ({
  requireProject: vi.fn(),
  requireToken: vi.fn(),
}));

vi.mock('../../src/lib/api.js', () => ({
  createClient: vi.fn(),
  KlaroApiError: class KlaroApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'KlaroApiError';
    }
  },
}));

vi.mock('../../src/lib/defaults.js', () => ({
  resolveBoard: vi.fn(),
}));

import { requireProject, requireToken } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard } from '../../src/lib/defaults.js';
import { createUpdateCommand } from '../../src/commands/update.js';
import { wrapWithGlobalOptions } from '../utils/test-helpers.js';

describe('update command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockCreateClient = vi.mocked(createClient);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update a card with a single dimension', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockUpdateStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-12', title: 'Test card', assignee: 'Claude' },
    ]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createUpdateCommand();
    await cmd.parseAsync(['node', 'test', '12', 'assignee=Claude', '-b', 'backlog']);

    expect(mockResolveBoard).toHaveBeenCalledWith('backlog', 'myproject');
    expect(mockUpdateStories).toHaveBeenCalledWith('backlog', [{ identifier: 12, assignee: 'Claude' }]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CARD-12'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('assignee'));
  });

  it('should update multiple cards', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockUpdateStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-12', title: 'Test card 1', assignee: 'Claude' },
      { id: 2, identifier: 'CARD-89', title: 'Test card 2', assignee: 'Claude' },
    ]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createUpdateCommand();
    await cmd.parseAsync(['node', 'test', '12', '89', 'assignee=Claude', '-b', 'backlog']);

    expect(mockUpdateStories).toHaveBeenCalledWith('backlog', [
      { identifier: 12, assignee: 'Claude' },
      { identifier: 89, assignee: 'Claude' },
    ]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CARD-12'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CARD-89'));
  });

  it('should update a card with multiple dimensions', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockUpdateStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-12', title: 'Test card', assignee: 'Claude', progress: 'done' },
    ]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createUpdateCommand();
    await cmd.parseAsync(['node', 'test', '12', 'assignee=Claude', 'progress=done', '-b', 'backlog']);

    expect(mockUpdateStories).toHaveBeenCalledWith('backlog', [
      { identifier: 12, assignee: 'Claude', progress: 'done' },
    ]);
  });

  it('should use default board when -b not specified', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockUpdateStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-12', title: 'Test card', assignee: 'Claude' },
    ]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createUpdateCommand();
    await cmd.parseAsync(['node', 'test', '12', 'assignee=Claude']);

    expect(mockResolveBoard).toHaveBeenCalledWith(undefined, 'myproject');
    expect(mockUpdateStories).toHaveBeenCalledWith('all', [{ identifier: 12, assignee: 'Claude' }]);
  });

  it('should use custom project from global option', async () => {
    mockRequireProject.mockReturnValue('custom-project');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockUpdateStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-12', title: 'Test card', assignee: 'Claude' },
    ]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = wrapWithGlobalOptions(createUpdateCommand());
    await cmd.parseAsync(['node', 'test', '-p', 'custom-project', '12', 'assignee=Claude']);

    expect(mockRequireProject).toHaveBeenCalledWith('custom-project');
  });

  it('should error when no dimensions provided', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const cmd = createUpdateCommand();
    await cmd.parseAsync(['node', 'test', '12', '-b', 'backlog']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: At least one dimension is required (key=value)');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error for invalid identifier', async () => {
    const cmd = createUpdateCommand();
    await cmd.parseAsync(['node', 'test', 'abc', 'assignee=Claude']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid identifier "abc": must be a number');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockUpdateStories = vi.fn().mockRejectedValue(new KlaroApiError(404, 'Card not found'));
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createUpdateCommand();
    await cmd.parseAsync(['node', 'test', '999', 'assignee=Claude', '-b', 'backlog']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Card not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
