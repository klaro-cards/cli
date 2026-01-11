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
  resolveShow: vi.fn(),
}));

vi.mock('../../src/utils/story-editor.js', () => ({
  editStoryInEditor: vi.fn(),
}));

import { requireProject, requireToken } from '../../src/lib/config.js';
import { editStoryInEditor } from '../../src/utils/story-editor.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard } from '../../src/lib/defaults.js';
import { createCreateCommand } from '../../src/commands/create.js';

describe('create command', () => {
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

  it('should create a card with title', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockCreateStory = vi.fn().mockResolvedValue({
      id: 1,
      identifier: 'CARD-1',
      title: 'New card',
    });
    mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'test', 'New card', '-b', 'backlog']);

    expect(mockResolveBoard).toHaveBeenCalledWith('backlog', 'myproject');
    expect(mockCreateClient).toHaveBeenCalledWith('myproject', 'token123');
    expect(mockCreateStory).toHaveBeenCalledWith('backlog', {
      title: 'New card',
    });
    // Check table output contains identifier and title
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('identifier');
    expect(output).toContain('title');
    expect(output).toContain('CARD-1');
    expect(output).toContain('New card');
  });

  it('should create a card with dimensions', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockCreateStory = vi.fn().mockResolvedValue({
      id: 1,
      identifier: 'CARD-1',
      title: 'New card',
    });
    mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

    const cmd = createCreateCommand();
    await cmd.parseAsync([
      'node', 'test', 'New card',
      '-b', 'backlog',
      '-d', 'progress=todo',
      '-d', 'priority=high',
    ]);

    expect(mockCreateStory).toHaveBeenCalledWith('backlog', {
      title: 'New card',
      progress: 'todo',
      priority: 'high',
    });
  });

  it('should use custom project from option', async () => {
    mockRequireProject.mockReturnValue('custom-project');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockCreateStory = vi.fn().mockResolvedValue({
      id: 1,
      identifier: 'CARD-1',
      title: 'New card',
    });
    mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'test', 'New card', '-b', 'backlog', '-p', 'custom-project']);

    expect(mockRequireProject).toHaveBeenCalledWith('custom-project');
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('badboard');

    const mockCreateStory = vi.fn().mockRejectedValue(new KlaroApiError(400, 'Invalid board'));
    mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'test', 'New card', '-b', 'badboard']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid board');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should use default board when -b not specified', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockCreateStory = vi.fn().mockResolvedValue({
      id: 1,
      identifier: 'CARD-1',
      title: 'New card',
    });
    mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'test', 'New card']);

    expect(mockResolveBoard).toHaveBeenCalledWith(undefined, 'myproject');
    expect(mockCreateStory).toHaveBeenCalledWith('all', { title: 'New card' });
  });

  it('should pass CLI board to resolveBoard', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('sprint-1');

    const mockCreateStory = vi.fn().mockResolvedValue({
      id: 1,
      identifier: 'CARD-1',
      title: 'New card',
    });
    mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'test', 'New card', '-b', 'sprint-1']);

    expect(mockResolveBoard).toHaveBeenCalledWith('sprint-1', 'myproject');
  });

  describe('--edit flag', () => {
    const mockEditStoryInEditor = vi.mocked(editStoryInEditor);

    it('should open editor after creating card with --edit', async () => {
      mockRequireProject.mockReturnValue('myproject');
      mockRequireToken.mockReturnValue('token123');
      mockResolveBoard.mockReturnValue('backlog');

      const mockCreateStory = vi.fn().mockResolvedValue({
        id: 1,
        identifier: '42',
        title: 'New card',
      });
      mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

      // Editor returns no changes
      mockEditStoryInEditor.mockReturnValue({ changed: false });

      const cmd = createCreateCommand();
      await cmd.parseAsync(['node', 'test', 'New card', '-e']);

      expect(mockCreateStory).toHaveBeenCalledWith('backlog', { title: 'New card' });
      expect(mockEditStoryInEditor).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: '42', title: 'New card' }),
        undefined
      );
      expect(consoleSpy).toHaveBeenCalledWith('Card 42 created (no edits made).');
    });

    it('should update card when editor content changes', async () => {
      mockRequireProject.mockReturnValue('myproject');
      mockRequireToken.mockReturnValue('token123');
      mockResolveBoard.mockReturnValue('backlog');

      const mockCreateStory = vi.fn().mockResolvedValue({
        id: 1,
        identifier: '42',
        title: 'New card',
      });
      const mockUpdateStories = vi.fn().mockResolvedValue([{
        id: 1,
        identifier: '42',
        title: 'Updated title',
        specification: 'Added description',
      }]);
      mockCreateClient.mockReturnValue({
        createStory: mockCreateStory,
        updateStories: mockUpdateStories,
      } as any);

      // Editor returns changes
      mockEditStoryInEditor.mockReturnValue({
        changed: true,
        update: {
          identifier: 42,
          title: 'Updated title',
          specification: 'Added description',
        },
      });

      const cmd = createCreateCommand();
      await cmd.parseAsync(['node', 'test', 'New card', '--edit']);

      expect(mockUpdateStories).toHaveBeenCalledWith('backlog', [{
        identifier: 42,
        title: 'Updated title',
        specification: 'Added description',
      }]);
      expect(consoleSpy).toHaveBeenCalledWith('Card 42 created and updated.');
    });

    it('should exit with error when editor fails', async () => {
      mockRequireProject.mockReturnValue('myproject');
      mockRequireToken.mockReturnValue('token123');
      mockResolveBoard.mockReturnValue('backlog');

      const mockCreateStory = vi.fn().mockResolvedValue({
        id: 1,
        identifier: '42',
        title: 'New card',
      });
      mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

      // Editor returns error
      mockEditStoryInEditor.mockReturnValue({
        changed: false,
        error: 'Editor exited with an error',
      });

      const cmd = createCreateCommand();
      await cmd.parseAsync(['node', 'test', 'New card', '-e']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Editor exited with an error');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
