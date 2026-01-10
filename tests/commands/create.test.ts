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

import { requireProject, requireToken } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { createCreateCommand } from '../../src/commands/create.js';

describe('create command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockCreateClient = vi.mocked(createClient);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a card with title', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockCreateStory = vi.fn().mockResolvedValue({
      id: 1,
      identifier: 'CARD-1',
      title: 'New card',
    });
    mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'test', 'New card', '-b', 'backlog']);

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

    const mockCreateStory = vi.fn().mockRejectedValue(new KlaroApiError(400, 'Invalid board'));
    mockCreateClient.mockReturnValue({ createStory: mockCreateStory } as any);

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'test', 'New card', '-b', 'badboard']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid board');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
