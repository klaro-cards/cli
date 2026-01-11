import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('../../src/lib/config.js', () => ({
  requireProject: vi.fn(),
  requireToken: vi.fn(),
  getConfigDir: vi.fn(),
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
  resolveShow: vi.fn(),
}));

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
}));

import { requireProject, requireToken, getConfigDir } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard, resolveShow } from '../../src/lib/defaults.js';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createFetchCommand } from '../../src/commands/fetch.js';

describe('fetch command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockGetConfigDir = vi.mocked(getConfigDir);
  const mockCreateClient = vi.mocked(createClient);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const mockResolveShow = vi.mocked(resolveShow);
  const mockWriteFileSync = vi.mocked(writeFileSync);
  const mockExistsSync = vi.mocked(existsSync);
  const mockMkdirSync = vi.mocked(mkdirSync);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfigDir.mockReturnValue('/home/user/.klaro');
    mockExistsSync.mockReturnValue(false); // Content dir doesn't exist by default
  });

  it('should fetch a single card and write to file', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockResolveShow.mockReturnValue(undefined);

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Test card', specification: 'Description', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createFetchCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(mockGetStories).toHaveBeenCalledWith('all', [12]);
    expect(mockMkdirSync).toHaveBeenCalledWith(
      '/home/user/.klaro/content/myproject',
      { recursive: true }
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/home/user/.klaro/content/myproject/12-test-card.md',
      expect.stringContaining('# Test card'),
      'utf-8'
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Fetched card 12'));
  });

  it('should fetch multiple cards', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');
    mockResolveShow.mockReturnValue(undefined);

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'First card', createdAt: '', updatedAt: '' },
      { id: 2, identifier: '13', title: 'Second card', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createFetchCommand();
    await cmd.parseAsync(['node', 'test', '12', '13', '-b', 'backlog']);

    expect(mockGetStories).toHaveBeenCalledWith('backlog', [12, 13]);
    expect(mockWriteFileSync).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Fetched 2 cards'));
  });

  it('should skip existing files without --force', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockResolveShow.mockReturnValue(undefined);
    mockExistsSync.mockReturnValue(true); // File exists

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Test card', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createFetchCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('--force'));
  });

  it('should overwrite existing files with --force', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockResolveShow.mockReturnValue(undefined);
    mockExistsSync.mockReturnValue(true); // File exists

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Test card', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createFetchCommand();
    await cmd.parseAsync(['node', 'test', '12', '--force']);

    expect(mockWriteFileSync).toHaveBeenCalled();
  });

  it('should report cards not found', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockResolveShow.mockReturnValue(undefined);

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Test card', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createFetchCommand();
    await cmd.parseAsync(['node', 'test', '12', '99']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Cards not found: 99');
  });

  it('should error when no cards found', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createFetchCommand();
    await cmd.parseAsync(['node', 'test', '999']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('No cards found with the specified identifier(s)');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error for invalid identifier', async () => {
    const cmd = createFetchCommand();
    await cmd.parseAsync(['node', 'test', 'abc']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid identifier "abc": must be a number');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockRejectedValue(new KlaroApiError(404, 'Board not found'));
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createFetchCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Board not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
