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
      '12-original-title.md'
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

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error on card 12: Editor exited with an error');
    expect(consoleSpy).toHaveBeenCalledWith('No changes made.');
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

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error on card 12: Invalid format: first line must be a heading (# title)');
    expect(consoleSpy).toHaveBeenCalledWith('No changes made.');
  });

  it('should error when card not found', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '999']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('No cards found with the specified identifier(s)');
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

  it('should edit multiple cards sequentially', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '10', title: 'Card 10', specification: 'Desc 10', createdAt: '', updatedAt: '' },
      { id: 2, identifier: '20', title: 'Card 20', specification: 'Desc 20', createdAt: '', updatedAt: '' },
      { id: 3, identifier: '30', title: 'Card 30', specification: 'Desc 30', createdAt: '', updatedAt: '' },
    ]);
    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories, updateStories: mockUpdateStories } as any);

    // First card: changed, second: unchanged, third: changed
    mockOpenInEditor
      .mockReturnValueOnce('# Card 10 updated\n\nNew desc 10')
      .mockReturnValueOnce('# Card 20\n\nDesc 20')  // unchanged
      .mockReturnValueOnce('# Card 30 updated\n\nNew desc 30');

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '10', '20', '30']);

    expect(mockGetStories).toHaveBeenCalledWith('all', [10, 20, 30]);
    expect(mockOpenInEditor).toHaveBeenCalledTimes(3);
    expect(mockUpdateStories).toHaveBeenCalledWith('all', [
      { identifier: 10, title: 'Card 10 updated', specification: 'New desc 10' },
      { identifier: 30, title: 'Card 30 updated', specification: 'New desc 30' },
    ]);
    expect(consoleSpy).toHaveBeenCalledWith('Cards 10, 30 updated successfully.');
  });

  it('should handle mixed results with errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '10', title: 'Card 10', createdAt: '', updatedAt: '' },
      { id: 2, identifier: '20', title: 'Card 20', createdAt: '', updatedAt: '' },
    ]);
    const mockUpdateStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories, updateStories: mockUpdateStories } as any);

    // First card: changed, second: editor error
    mockOpenInEditor
      .mockReturnValueOnce('# Card 10 updated\n\nNew desc')
      .mockReturnValueOnce(null);

    const cmd = createEditCommand();
    await cmd.parseAsync(['node', 'test', '10', '20']);

    expect(mockUpdateStories).toHaveBeenCalledWith('all', [
      { identifier: 10, title: 'Card 10 updated', specification: 'New desc' },
    ]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error on card 20: Editor exited with an error');
    expect(consoleSpy).toHaveBeenCalledWith('Card 10 updated successfully.');
  });
});
