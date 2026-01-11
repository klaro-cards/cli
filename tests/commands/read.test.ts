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

vi.mock('../../src/utils/markdown.js', () => ({
  renderMarkdown: vi.fn((text: string) => text),
}));

import { requireProject, requireToken } from '../../src/lib/config.js';
import { createClient, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard } from '../../src/lib/defaults.js';
import { createReadCommand } from '../../src/commands/read.js';
import { formatStoryMarkdown } from '../../src/utils/story-markdown.js';

describe('formatStoryMarkdown', () => {
  it('should format story with title only', () => {
    const story = { id: 1, identifier: '12', title: 'Simple title', createdAt: '', updatedAt: '' };
    const result = formatStoryMarkdown(story);
    expect(result).toBe('# Simple title\n');
  });

  it('should format story with multiline title (summary)', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Main title\nThis is a summary\nWith multiple lines',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story);
    expect(result).toBe('# Main title\n\nThis is a summary\nWith multiple lines\n');
  });

  it('should format story with specification (description)', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Card title',
      specification: 'This is the description\nwith details.',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story);
    expect(result).toBe('# Card title\n\nThis is the description\nwith details.');
  });

  it('should format story with title, summary, and description', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Main title\nSummary text here',
      specification: 'Full description follows.',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story);
    expect(result).toBe('# Main title\n\nSummary text here\n\nFull description follows.');
  });
});

describe('read command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockCreateClient = vi.mocked(createClient);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read a single card and display as markdown', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Test card', specification: 'Description here', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createReadCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(mockResolveBoard).toHaveBeenCalledWith(undefined, 'myproject');
    expect(mockGetStories).toHaveBeenCalledWith('all', [12]);
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('# Test card'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Description here'));
  });

  it('should read multiple cards', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('backlog');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'First card', createdAt: '', updatedAt: '' },
      { id: 2, identifier: '13', title: 'Second card', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createReadCommand();
    await cmd.parseAsync(['node', 'test', '12', '13', '-b', 'backlog']);

    expect(mockGetStories).toHaveBeenCalledWith('backlog', [12, 13]);
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('# First card'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('# Second card'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('---'));
  });

  it('should use board from option', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('sprint');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Test', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createReadCommand();
    await cmd.parseAsync(['node', 'test', '12', '-b', 'sprint']);

    expect(mockResolveBoard).toHaveBeenCalledWith('sprint', 'myproject');
    expect(mockGetStories).toHaveBeenCalledWith('sprint', [12]);
  });

  it('should use project from option', async () => {
    mockRequireProject.mockReturnValue('other-project');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([
      { id: 1, identifier: '12', title: 'Test', createdAt: '', updatedAt: '' },
    ]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createReadCommand();
    await cmd.parseAsync(['node', 'test', '12', '-p', 'other-project']);

    expect(mockRequireProject).toHaveBeenCalledWith('other-project');
  });

  it('should error when no cards found', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    const mockGetStories = vi.fn().mockResolvedValue([]);
    mockCreateClient.mockReturnValue({ getStories: mockGetStories } as any);

    const cmd = createReadCommand();
    await cmd.parseAsync(['node', 'test', '999']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('No cards found with the specified identifier(s)');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error for invalid identifier', async () => {
    const cmd = createReadCommand();
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

    const cmd = createReadCommand();
    await cmd.parseAsync(['node', 'test', '12']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Board not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
