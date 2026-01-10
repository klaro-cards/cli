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
import { createDelCommand } from '../../src/commands/del.js';

describe('del command', () => {
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

  it('should delete a single card', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockDeleteStories = vi.fn().mockResolvedValue(undefined);
    mockCreateClient.mockReturnValue({ deleteStories: mockDeleteStories } as any);

    const cmd = createDelCommand();
    await cmd.parseAsync(['node', 'test', '12', '-b', 'backlog']);

    expect(mockResolveBoard).toHaveBeenCalledWith('backlog', 'myproject');
    expect(mockDeleteStories).toHaveBeenCalledWith('backlog', [12]);
    expect(consoleSpy).toHaveBeenCalledWith('Deleted 1 card: 12');
  });

  it('should delete multiple cards', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockDeleteStories = vi.fn().mockResolvedValue(undefined);
    mockCreateClient.mockReturnValue({ deleteStories: mockDeleteStories } as any);

    const cmd = createDelCommand();
    await cmd.parseAsync(['node', 'test', '12', '89', '187', '-b', 'backlog']);

    expect(mockDeleteStories).toHaveBeenCalledWith('backlog', [12, 89, 187]);
    expect(consoleSpy).toHaveBeenCalledWith('Deleted 3 cards: 12, 89, 187');
  });

  it('should use default board when -b not specified', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockDeleteStories = vi.fn().mockResolvedValue(undefined);
    mockCreateClient.mockReturnValue({ deleteStories: mockDeleteStories } as any);

    const cmd = createDelCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(mockResolveBoard).toHaveBeenCalledWith(undefined, 'myproject');
    expect(mockDeleteStories).toHaveBeenCalledWith('all', [12]);
  });

  it('should use custom project from option', async () => {
    mockRequireProject.mockReturnValue('custom-project');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockDeleteStories = vi.fn().mockResolvedValue(undefined);
    mockCreateClient.mockReturnValue({ deleteStories: mockDeleteStories } as any);

    const cmd = createDelCommand();
    await cmd.parseAsync(['node', 'test', '12', '-b', 'backlog', '-p', 'custom-project']);

    expect(mockRequireProject).toHaveBeenCalledWith('custom-project');
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockDeleteStories = vi.fn().mockRejectedValue(new KlaroApiError(404, 'Card not found'));
    mockCreateClient.mockReturnValue({ deleteStories: mockDeleteStories } as any);

    const cmd = createDelCommand();
    await cmd.parseAsync(['node', 'test', '999', '-b', 'backlog']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Card not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
