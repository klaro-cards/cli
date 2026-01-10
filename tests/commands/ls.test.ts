import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { requireProject, requireToken } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { createLsCommand } from '../../src/commands/ls.js';

describe('ls command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockCreateClient = vi.mocked(createClient);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list cards from a board', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-1', title: 'First card' },
      { id: 2, identifier: 'CARD-2', title: 'Second card' },
    ]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', 'backlog']);

    expect(mockCreateClient).toHaveBeenCalledWith('myproject', 'token123');
    expect(mockListStories).toHaveBeenCalledWith('backlog', { limit: 20 });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CARD-1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('First card'));
  });

  it('should use custom project from option', async () => {
    mockRequireProject.mockReturnValue('custom-project');
    mockRequireToken.mockReturnValue('token123');

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', 'backlog', '-p', 'custom-project']);

    expect(mockRequireProject).toHaveBeenCalledWith('custom-project');
  });

  it('should use custom limit', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', 'backlog', '-l', '50']);

    expect(mockListStories).toHaveBeenCalledWith('backlog', { limit: 50 });
  });

  it('should show message when no cards found', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', 'emptyboard']);

    expect(consoleSpy).toHaveBeenCalledWith('No cards found.');
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListStories = vi.fn().mockRejectedValue(new KlaroApiError(404, 'Board not found'));
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', 'nonexistent']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Board not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should show additional dimensions when -d option is used', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-1', title: 'First card', progress: 'todo', assignee: 'Alice' },
      { id: 2, identifier: 'CARD-2', title: 'Second card', progress: 'done', assignee: 'Bob' },
    ]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', 'backlog', '-d', 'progress,assignee']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('progress'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('assignee'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('todo'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Alice'));
  });

  it('should only show identifier and title by default', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-1', title: 'First card', createdAt: '2024-01-01', progress: 'todo' },
    ]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', 'backlog']);

    // Should contain identifier and title
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CARD-1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('First card'));
    // Should NOT contain other fields like createdAt or progress
    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).not.toContain('createdAt');
    expect(allCalls).not.toContain('2024-01-01');
  });
});
