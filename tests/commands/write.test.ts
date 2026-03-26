import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('../../src/utils/stdin.js', () => ({
  readStdin: vi.fn(),
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

import { requireProject, requireToken } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard } from '../../src/lib/defaults.js';
import { readStdin } from '../../src/utils/stdin.js';
import { readFileSync } from 'node:fs';
import { createWriteCommand, buildUpdate } from '../../src/commands/write.js';
import { wrapWithGlobalOptions } from '../utils/test-helpers.js';

describe('buildUpdate', () => {
  it('should parse markdown into an update object', () => {
    const md = '# My Title\n\nSome description here.';
    const result = buildUpdate(42, md);
    expect(result).toEqual({
      identifier: 42,
      title: 'My Title',
      specification: 'Some description here.',
    });
  });

  it('should include dimensions from frontmatter', () => {
    const md = '---\nstatus: done\n---\n\n# My Title\n\nDescription.';
    const result = buildUpdate(42, md);
    expect(result).toEqual({
      identifier: 42,
      title: 'My Title',
      specification: 'Description.',
      status: 'done',
    });
  });

  it('should handle title-only markdown', () => {
    const md = '# Just a title';
    const result = buildUpdate(10, md);
    expect(result).toEqual({
      identifier: 10,
      title: 'Just a title',
      specification: '',
    });
  });
});

describe('write command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockCreateClient = vi.mocked(createClient);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const mockReadStdin = vi.mocked(readStdin);
  const mockReadFileSync = vi.mocked(readFileSync);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write card content from stdin', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockReadStdin.mockResolvedValue('# Updated Title\n\nNew description.');

    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createWriteCommand();
    await cmd.parseAsync(['node', 'test', '42']);

    expect(mockUpdateStories).toHaveBeenCalledWith('all', [{
      identifier: 42,
      title: 'Updated Title',
      specification: 'New description.',
    }]);
    expect(consoleSpy).toHaveBeenCalledWith('Card 42 updated successfully.');
  });

  it('should write card content from a file', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockReadFileSync.mockReturnValue('# File Title\n\nFile content.');

    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createWriteCommand();
    await cmd.parseAsync(['node', 'test', '42', '-f', 'card.md']);

    expect(mockReadFileSync).toHaveBeenCalledWith('card.md', 'utf-8');
    expect(mockUpdateStories).toHaveBeenCalledWith('all', [{
      identifier: 42,
      title: 'File Title',
      specification: 'File content.',
    }]);
  });

  it('should read from stdin when file is "-"', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockReadStdin.mockResolvedValue('# Stdin Title\n\nStdin content.');

    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createWriteCommand();
    await cmd.parseAsync(['node', 'test', '42', '-f', '-']);

    expect(mockReadStdin).toHaveBeenCalled();
    expect(mockUpdateStories).toHaveBeenCalledWith('all', [{
      identifier: 42,
      title: 'Stdin Title',
      specification: 'Stdin content.',
    }]);
  });

  it('should use board option', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('sprint');
    mockReadStdin.mockResolvedValue('# Title\n\nContent.');

    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createWriteCommand();
    await cmd.parseAsync(['node', 'test', '42', '-b', 'sprint']);

    expect(mockResolveBoard).toHaveBeenCalledWith('sprint', 'myproject');
    expect(mockUpdateStories).toHaveBeenCalledWith('sprint', expect.any(Array));
  });

  it('should use project from global option', async () => {
    mockRequireProject.mockReturnValue('other-project');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockReadStdin.mockResolvedValue('# Title\n\nContent.');

    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = wrapWithGlobalOptions(createWriteCommand());
    await cmd.parseAsync(['node', 'test', '-p', 'other-project', '42']);

    expect(mockRequireProject).toHaveBeenCalledWith('other-project');
  });

  it('should error on empty content', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockReadStdin.mockResolvedValue('   ');

    const cmd = createWriteCommand();
    await cmd.parseAsync(['node', 'test', '42']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: No content provided');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error for invalid identifier', async () => {
    const cmd = createWriteCommand();
    await cmd.parseAsync(['node', 'test', 'abc']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid identifier "abc": must be a number');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');
    mockReadStdin.mockResolvedValue('# Title\n\nContent.');

    const mockUpdateStories = vi.fn().mockRejectedValue(new KlaroApiError(404, 'Board not found'));
    mockCreateClient.mockReturnValue({ updateStories: mockUpdateStories } as any);

    const cmd = createWriteCommand();
    await cmd.parseAsync(['node', 'test', '42']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Board not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
