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
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

import { requireProject, requireToken, getConfigDir } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard } from '../../src/lib/defaults.js';
import { readFileSync, unlinkSync, existsSync, readdirSync } from 'node:fs';
import { createSyncCommand } from '../../src/commands/sync.js';

describe('sync command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockGetConfigDir = vi.mocked(getConfigDir);
  const mockCreateClient = vi.mocked(createClient);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const mockReadFileSync = vi.mocked(readFileSync);
  const mockUnlinkSync = vi.mocked(unlinkSync);
  const mockExistsSync = vi.mocked(existsSync);
  const mockReaddirSync = vi.mocked(readdirSync);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfigDir.mockReturnValue('/home/user/.klaro');
  });

  it('should sync cards and delete files by default', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['12-test-card.md'] as unknown as ReturnType<typeof readdirSync>);
    mockReadFileSync.mockReturnValue('# Test card\n\nDescription here');

    const mockUpdateStories = vi.fn().mockResolvedValue({});
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createSyncCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(mockUpdateStories).toHaveBeenCalledWith('all', [
      { identifier: 12, title: 'Test card', specification: 'Description here' },
    ]);
    expect(mockUnlinkSync).toHaveBeenCalledWith('/home/user/.klaro/content/myproject/12-test-card.md');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('synced and deleted'));
  });

  it('should keep files with --keep option', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['12-test-card.md'] as unknown as ReturnType<typeof readdirSync>);
    mockReadFileSync.mockReturnValue('# Test card\n\nDescription');

    const mockUpdateStories = vi.fn().mockResolvedValue({});
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createSyncCommand();
    await cmd.parseAsync(['node', 'test', '--keep']);

    expect(mockUpdateStories).toHaveBeenCalled();
    expect(mockUnlinkSync).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('synced'));
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('deleted'));
  });

  it('should show dry-run output without making changes', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['12-test-card.md'] as unknown as ReturnType<typeof readdirSync>);
    mockReadFileSync.mockReturnValue('# Test card\n\nDescription');

    const mockUpdateStories = vi.fn().mockResolvedValue({});
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createSyncCommand();
    await cmd.parseAsync(['node', 'test', '--dry-run']);

    expect(mockUpdateStories).not.toHaveBeenCalled();
    expect(mockUnlinkSync).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Dry run - would sync:');
  });

  it('should sync multiple cards', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      '12-first-card.md',
      '13-second-card.md',
    ] as unknown as ReturnType<typeof readdirSync>);
    mockReadFileSync
      .mockReturnValueOnce('# First card')
      .mockReturnValueOnce('# Second card');

    const mockUpdateStories = vi.fn().mockResolvedValue({});
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createSyncCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(mockUpdateStories).toHaveBeenCalledWith('all', expect.arrayContaining([
      expect.objectContaining({ identifier: 12 }),
      expect.objectContaining({ identifier: 13 }),
    ]));
    expect(mockUnlinkSync).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 cards'));
  });

  it('should report nothing to sync when directory is empty', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockExistsSync.mockReturnValue(false); // Directory doesn't exist

    const cmd = createSyncCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(consoleSpy).toHaveBeenCalledWith('Nothing to sync.');
  });

  it('should skip files with invalid filename format', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      'invalid-filename.md',
      '12-valid-card.md',
    ] as unknown as ReturnType<typeof readdirSync>);
    mockReadFileSync.mockReturnValue('# Valid card');

    const mockUpdateStories = vi.fn().mockResolvedValue({});
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createSyncCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(mockUpdateStories).toHaveBeenCalledWith('all', [
      expect.objectContaining({ identifier: 12 }),
    ]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid filename format'));
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['12-test-card.md'] as unknown as ReturnType<typeof readdirSync>);
    mockReadFileSync.mockReturnValue('# Test card');

    const mockUpdateStories = vi.fn().mockRejectedValue(new KlaroApiError(400, 'Invalid update'));
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createSyncCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid update');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });
});
