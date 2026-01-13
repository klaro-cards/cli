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
import { createDescribeCommand } from '../../src/commands/describe.js';
import { wrapWithGlobalOptions } from '../utils/test-helpers.js';

describe('describe command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockCreateClient = vi.mocked(createClient);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display dimension details with values', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockResolvedValue([
      {
        code: 'status',
        label: 'Status',
        datatype: 'Nominal',
        values: [
          { id: 1, label: 'To Do' },
          { id: 2, label: 'In Progress' },
          { id: 3, label: 'Done' },
        ],
      },
    ]);
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = createDescribeCommand();
    await cmd.parseAsync(['node', 'test', 'status']);

    expect(mockCreateClient).toHaveBeenCalledWith('myproject', 'token123');
    expect(mockListDimensions).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Dimension:'), 'Status');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Datatype:'), 'Nominal');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 3 value(s)'));
  });

  it('should display dimension without values', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockResolvedValue([
      {
        code: 'assignee',
        label: 'Assignee',
        datatype: 'String',
        values: [],
      },
    ]);
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = createDescribeCommand();
    await cmd.parseAsync(['node', 'test', 'assignee']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Dimension:'), 'Assignee');
    expect(consoleSpy).toHaveBeenCalledWith('\nNo predefined values (free-form input)');
  });

  it('should display dimension with undefined values', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockResolvedValue([
      {
        code: 'custom',
        label: 'Custom Field',
        datatype: 'Text',
      },
    ]);
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = createDescribeCommand();
    await cmd.parseAsync(['node', 'test', 'custom']);

    expect(consoleSpy).toHaveBeenCalledWith('\nNo predefined values (free-form input)');
  });

  it('should handle dimension not found', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockResolvedValue([
      { code: 'status', label: 'Status', datatype: 'Nominal' },
    ]);
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = createDescribeCommand();
    await cmd.parseAsync(['node', 'test', 'nonexistent']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Dimension "nonexistent" not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle API errors', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockRejectedValue(new KlaroApiError(500, 'Server error'));
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = createDescribeCommand();
    await cmd.parseAsync(['node', 'test', 'status']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Server error');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should use custom project from global option', async () => {
    mockRequireProject.mockReturnValue('custom-project');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockResolvedValue([
      { code: 'status', label: 'Status', datatype: 'Nominal', values: [] },
    ]);
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = wrapWithGlobalOptions(createDescribeCommand());
    await cmd.parseAsync(['node', 'test', '-p', 'custom-project', 'status']);

    expect(mockRequireProject).toHaveBeenCalledWith('custom-project');
    expect(mockCreateClient).toHaveBeenCalledWith('custom-project', 'token123');
  });

  it('should display values with null id as dash', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockResolvedValue([
      {
        code: 'priority',
        label: 'Priority',
        datatype: 'Nominal',
        values: [
          { id: null, label: 'None' },
          { id: 1, label: 'Low' },
        ],
      },
    ]);
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = createDescribeCommand();
    await cmd.parseAsync(['node', 'test', 'priority']);

    // The table should contain the values
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 2 value(s)'));
  });

  it('should display values with missing label as dash', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockResolvedValue([
      {
        code: 'tags',
        label: 'Tags',
        datatype: 'MultiSelect',
        values: [
          { id: 1 },
          { id: 2, label: 'Feature' },
        ],
      },
    ]);
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = createDescribeCommand();
    await cmd.parseAsync(['node', 'test', 'tags']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 2 value(s)'));
  });

  it('should fall back to code when name is undefined', async () => {
    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');

    const mockListDimensions = vi.fn().mockResolvedValue([
      {
        code: 'state',
        datatype: 'Progress',
        values: [],
      },
    ]);
    mockCreateClient.mockReturnValue({ listDimensions: mockListDimensions } as any);

    const cmd = createDescribeCommand();
    await cmd.parseAsync(['node', 'test', 'state']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Dimension:'), 'state');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Datatype:'), 'Progress');
  });
});
