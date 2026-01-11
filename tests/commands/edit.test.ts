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

vi.mock('../../src/utils/editor.js', () => ({
  openInEditor: vi.fn(),
}));

import { requireProject, requireToken } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard } from '../../src/lib/defaults.js';
import { openInEditor } from '../../src/utils/editor.js';
import { createEditCommand } from '../../src/commands/edit.js';

describe('edit command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockCreateClient = vi.mocked(createClient);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const mockOpenInEditor = vi.mocked(openInEditor);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should edit a card successfully', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Original title', specification: 'Original description', createdAt: '', updatedAt: '' },
    ]);
    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories, updateStories: mockUpdateStories } as any);

    // Simulate user editing the content
    mockOpenInEditor.mockReturnValue('# New title\n\nNew description');

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(mockGetStories).toHaveBeenCalledWith('all', [12]);
    expect(mockOpenInEditor).toHaveBeenCalledWith(
      '# Original title\n\nOriginal description',
      'card-12.md'
    );
    expect(mockUpdateStories).toHaveBeenCalledWith('all', [
      { identifier: 12, title: 'New title', specification: 'New description' },
    ]);
    expect(consoleSpy).toHaveBeenCalledWith('Card 12 updated successfully.');
  });

  it('should handle no changes made', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Original title', specification: 'Description', createdAt: '', updatedAt: '' },
    ]);
    const mockUpdateStories = vi.fn();
    mockCreateClient.mockReturnValue({ getStories: mockGetStories, updateStories: mockUpdateStories } as any);

    // Return the same content
    mockOpenInEditor.mockReturnValue('# Original title\n\nDescription');

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(mockUpdateStories).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('No changes made.');
  });

  it('should handle editor error', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Title', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    // Editor returns null on error
    mockOpenInEditor.mockReturnValue(null);

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Editor exited with an error');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle invalid markdown format', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Title', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    // Return invalid markdown (no heading)
    mockOpenInEditor.mockReturnValue('No heading here');

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid format: first line must be a heading (# title)');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error when card not found', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '999']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('No card found with the specified identifier');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error for invalid identifier', async () => {
    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', 'abc']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid identifier "abc": must be a number');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should use board from option', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Title', createdAt: '', updatedAt: '' },
    ]);
    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories, updateStories: mockUpdateStories } as any);

    mockOpenInEditor.mockReturnValue('# Updated\n\nNew content');

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '12', '-b', 'backlog']);

    expect(mockResolveBoard).toHaveBeenCalledWith('backlog', 'myproject');
    expect(mockGetStories).toHaveBeenCalledWith('backlog', [12]);
    expect(mockUpdateStories).toHaveBeenCalledWith('backlog', expect.any(Array));
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockRejectedValue(new KlaroApiError(404, 'Board not found'));
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Board not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
