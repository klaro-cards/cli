import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules
vi.mock('../../src/lib/config.js', () => ({
  getProjectOrDefault: vi.fn(),
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
  resolveDims: vi.fn(),
}));

import { getProjectOrDefault, requireProject, requireToken } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard, resolveDims } from '../../src/lib/defaults.js';
import { createLsCommand } from '../../src/commands/ls.js';
import { wrapWithGlobalOptions } from '../utils/test-helpers.js';

describe('ls command', () => {
  const mockGetProjectOrDefault = vi.mocked(getProjectOrDefault);
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockCreateClient = vi.mocked(createClient);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const mockResolveDims = vi.mocked(resolveDims);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list cards from a board', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-1', title: 'First card' },
      { id: 2, identifier: 'CARD-2', title: 'Second card' },
    ]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'backlog']);

    expect(mockResolveBoard).toHaveBeenCalledWith('backlog', 'myproject');
    expect(mockCreateClient).toHaveBeenCalledWith('myproject', 'token123');
    expect(mockListStories).toHaveBeenCalledWith('backlog', { limit: 20, filters: {} });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CARD-1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('First card'));
  });

  it('should use custom project from global option', async () => {
    mockRequireProject.mockReturnValue('custom-project');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = wrapWithGlobalOptions(createLsCommand());
    await cmd.parseAsync(['node', 'test', '-p', 'custom-project', '-b', 'backlog']);

    expect(mockRequireProject).toHaveBeenCalledWith('custom-project');
  });

  it('should use custom limit', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'backlog', '-l', '50']);

    expect(mockListStories).toHaveBeenCalledWith('backlog', { limit: 50, filters: {} });
  });

  it('should show message when no cards found', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('emptyboard');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'emptyboard']);

    expect(consoleSpy).toHaveBeenCalledWith('No cards found in board emptyboard.');
    expect(consoleSpy).toHaveBeenCalledWith('\n💡 Hint: klaro create "My first card"');
  });

  it('should include dims in create example when configured', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('emptyboard');
    mockResolveDims.mockReturnValue('status,priority');

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'emptyboard']);

    expect(consoleSpy).toHaveBeenCalledWith('No cards found in board emptyboard.');
    expect(consoleSpy).toHaveBeenCalledWith('\n💡 Hint: klaro create "My first card" status=value priority=value');
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('nonexistent');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockRejectedValue(new KlaroApiError(404, 'Board not found'));
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'nonexistent']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Board not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should show additional columns when --show option is used', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');
    mockResolveDims.mockReturnValue('progress,assignee');

    const mockListStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-1', title: 'First card', progress: 'todo', assignee: 'Alice' },
      { id: 2, identifier: 'CARD-2', title: 'Second card', progress: 'done', assignee: 'Bob' },
    ]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'backlog', '--dims', 'progress,assignee']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('progress'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('assignee'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('todo'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Alice'));
  });

  it('should filter cards when -f option is used', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'backlog', '-f', 'assignee=Claude']);

    expect(mockListStories).toHaveBeenCalledWith('backlog', {
      limit: 20,
      filters: { assignee: 'Claude' },
    });
  });

  it('should only show identifier and title by default', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: 'CARD-1', title: 'First card', createdAt: '2024-01-01', progress: 'todo' },
    ]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'backlog']);

    // Should contain identifier and title
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CARD-1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('First card'));
    // Should NOT contain other fields like createdAt or progress
    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).not.toContain('createdAt');
    expect(allCalls).not.toContain('2024-01-01');
  });

  it('should use default board when -b not specified', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(mockResolveBoard).toHaveBeenCalledWith(undefined, 'myproject');
    expect(mockListStories).toHaveBeenCalledWith('all', { limit: 20, filters: {} });
  });

  it('should pass CLI board to resolveBoard', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('sprint-1');
    mockResolveDims.mockReturnValue(undefined);

    const mockListStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

    const cmd = createLsCommand();
    await cmd.parseAsync(['node', 'test', '-b', 'sprint-1']);

    expect(mockResolveBoard).toHaveBeenCalledWith('sprint-1', 'myproject');
  });

  describe('ls projects', () => {
    it('should list projects', async () => {
      mockGetProjectOrDefault.mockReturnValue('myproject');
      mockRequireToken.mockReturnValue('token123');

      const mockListProjects = vi.fn().mockResolvedValue([
        { id: 1, subdomain: 'project-a', name: 'Project A' },
        { id: 2, subdomain: 'project-b', name: 'Project B' },
      ]);
      mockCreateClient.mockReturnValue({ listProjects: mockListProjects } as any);

      const cmd = createLsCommand();
      await cmd.parseAsync(['node', 'test', 'projects']);

      expect(mockListProjects).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('project-a'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Project A'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 project(s)'));
    });

    it('should show message when no projects found', async () => {
      mockGetProjectOrDefault.mockReturnValue('app');
      mockRequireToken.mockReturnValue('token123');

      const mockListProjects = vi.fn().mockResolvedValue([]);
      mockCreateClient.mockReturnValue({ listProjects: mockListProjects } as any);

      const cmd = createLsCommand();
      await cmd.parseAsync(['node', 'test', 'projects']);

      expect(consoleSpy).toHaveBeenCalledWith('No projects found.');
    });
  });

  describe('ls boards', () => {
    it('should list boards', async () => {
      mockRequireProject.mockReturnValue('myproject');
      mockRequireToken.mockReturnValue('token123');

      const mockListBoards = vi.fn().mockResolvedValue([
        { id: 1, location: 'backlog', label: 'Backlog' },
        { id: 2, location: 'sprint-1', label: 'Sprint 1' },
      ]);
      mockCreateClient.mockReturnValue({ listBoards: mockListBoards } as any);

      const cmd = createLsCommand();
      await cmd.parseAsync(['node', 'test', 'boards']);

      expect(mockListBoards).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('backlog'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Backlog'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 board(s)'));
    });

    it('should show message when no boards found', async () => {
      mockRequireProject.mockReturnValue('myproject');
      mockRequireToken.mockReturnValue('token123');

      const mockListBoards = vi.fn().mockResolvedValue([]);
      mockCreateClient.mockReturnValue({ listBoards: mockListBoards } as any);

      const cmd = createLsCommand();
      await cmd.parseAsync(['node', 'test', 'boards']);

      expect(consoleSpy).toHaveBeenCalledWith('No boards found.');
    });
  });

  describe('ls cards (explicit subcommand)', () => {
    it('should list cards when using explicit cards subcommand', async () => {
      mockRequireProject.mockReturnValue('myproject');
      mockRequireToken.mockReturnValue('token123');
      mockResolveBoard.mockReturnValue('backlog');
      mockResolveDims.mockReturnValue(undefined);

      const mockListStories = vi.fn().mockResolvedValue([
        { id: 1, identifier: 'CARD-1', title: 'First card' },
      ]);
      mockCreateClient.mockReturnValue({ listStories: mockListStories } as any);

      const cmd = createLsCommand();
      await cmd.parseAsync(['node', 'test', 'cards', '-b', 'backlog']);

      expect(mockListStories).toHaveBeenCalledWith('backlog', { limit: 20, filters: {} });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CARD-1'));
    });
  });
});
