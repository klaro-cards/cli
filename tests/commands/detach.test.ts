import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/config.js', () => ({
  requireProject: vi.fn(),
  requireToken: vi.fn(),
  getApiUrl: vi.fn(() => 'https://api.klaro.cards'),
}));

vi.mock('../../src/lib/api.js', () => ({
  KlaroApi: vi.fn(),
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

import { requireProject, requireToken } from '../../src/lib/config.js';
import { KlaroApi, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard } from '../../src/lib/defaults.js';
import { createDetachCommand } from '../../src/commands/detach.js';

describe('detach command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  const mockGetStories = vi.fn();
  const mockListAttachments = vi.fn();
  const mockDeleteAttachment = vi.fn();
  const mockDeleteSeshatFile = vi.fn();

  const attachment = {
    id: 'abc-123-uuid',
    filename: 'photo.jpg',
    url: '/s/abc123?n=photo.jpg',
    isCover: false,
    sizeInBytes: 1024,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    vi.mocked(KlaroApi).mockImplementation(() => ({
      getStories: mockGetStories,
      listAttachments: mockListAttachments,
      deleteAttachment: mockDeleteAttachment,
      deleteSeshatFile: mockDeleteSeshatFile,
    }) as any);
  });

  describe('with attachment UUID', () => {
    it('should detach by UUID and delete the seshat file by default', async () => {
      mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
      mockListAttachments.mockResolvedValue([attachment]);
      mockDeleteSeshatFile.mockResolvedValue(undefined);
      mockDeleteAttachment.mockResolvedValue(undefined);

      const cmd = createDetachCommand();
      await cmd.parseAsync(['node', 'test', '42', 'abc-123-uuid']);

      expect(mockGetStories).toHaveBeenCalledWith('all', [42]);
      expect(mockListAttachments).toHaveBeenCalledWith('999');
      expect(mockDeleteSeshatFile).toHaveBeenCalledWith('/s/abc123?n=photo.jpg');
      expect(mockDeleteAttachment).toHaveBeenCalledWith('999', 'abc-123-uuid');
      expect(consoleSpy).toHaveBeenCalledWith('Detached photo.jpg from card 42');
    });

    it('should keep the seshat file when --keep-file is set', async () => {
      mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
      mockListAttachments.mockResolvedValue([attachment]);
      mockDeleteAttachment.mockResolvedValue(undefined);

      const cmd = createDetachCommand();
      await cmd.parseAsync(['node', 'test', '42', 'abc-123-uuid', '--keep-file']);

      expect(mockDeleteSeshatFile).not.toHaveBeenCalled();
      expect(mockDeleteAttachment).toHaveBeenCalledWith('999', 'abc-123-uuid');
      expect(consoleSpy).toHaveBeenCalledWith('Detached photo.jpg from card 42');
    });

    it('should error when card is not found', async () => {
      mockGetStories.mockResolvedValue([]);

      const cmd = createDetachCommand();
      await cmd.parseAsync(['node', 'test', '99', 'abc-123-uuid']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Card 99 not found');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should error when attachment UUID is not found', async () => {
      mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
      mockListAttachments.mockResolvedValue([
        { id: 'other-uuid', filename: 'other.pdf', url: '/s/xyz?n=other.pdf', isCover: false, sizeInBytes: 512 },
      ]);

      const cmd = createDetachCommand();
      await cmd.parseAsync(['node', 'test', '42', 'abc-123-uuid']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Attachment "abc-123-uuid" not found on card 42');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockDeleteAttachment).not.toHaveBeenCalled();
    });
  });

  describe('with seshat URL', () => {
    it('should find attachment by URL, delete seshat file and attachment record', async () => {
      mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
      mockListAttachments.mockResolvedValue([attachment]);
      mockDeleteSeshatFile.mockResolvedValue(undefined);
      mockDeleteAttachment.mockResolvedValue(undefined);

      const cmd = createDetachCommand();
      await cmd.parseAsync(['node', 'test', '42', '/s/abc123?n=photo.jpg']);

      expect(mockGetStories).toHaveBeenCalledWith('all', [42]);
      expect(mockListAttachments).toHaveBeenCalledWith('999');
      expect(mockDeleteSeshatFile).toHaveBeenCalledWith('/s/abc123?n=photo.jpg');
      expect(mockDeleteAttachment).toHaveBeenCalledWith('999', 'abc-123-uuid');
      expect(consoleSpy).toHaveBeenCalledWith('Detached photo.jpg from card 42');
    });

    it('should error when seshat URL does not match any attachment', async () => {
      mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
      mockListAttachments.mockResolvedValue([attachment]);

      const cmd = createDetachCommand();
      await cmd.parseAsync(['node', 'test', '42', '/s/notfound?n=x.jpg']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Attachment "/s/notfound?n=x.jpg" not found on card 42');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  it('should handle API errors', async () => {
    mockGetStories.mockRejectedValue(new KlaroApiError(403, 'Forbidden'));

    const cmd = createDetachCommand();
    await cmd.parseAsync(['node', 'test', '42', 'abc-123-uuid']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Forbidden');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should use board option', async () => {
    mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
    mockListAttachments.mockResolvedValue([attachment]);
    mockDeleteSeshatFile.mockResolvedValue(undefined);
    mockDeleteAttachment.mockResolvedValue(undefined);

    const cmd = createDetachCommand();
    await cmd.parseAsync(['node', 'test', '42', 'abc-123-uuid', '-b', 'backlog']);

    expect(mockResolveBoard).toHaveBeenCalledWith('backlog', 'myproject');
  });
});
