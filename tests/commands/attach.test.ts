import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, statSync } from 'fs';

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

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  statSync: vi.fn(),
}));

import { requireProject, requireToken } from '../../src/lib/config.js';
import { KlaroApi, KlaroApiError } from '../../src/lib/api.js';
import { resolveBoard } from '../../src/lib/defaults.js';
import { createAttachCommand } from '../../src/commands/attach.js';

describe('attach command', () => {
  const mockRequireProject = vi.mocked(requireProject);
  const mockRequireToken = vi.mocked(requireToken);
  const mockResolveBoard = vi.mocked(resolveBoard);
  const mockReadFileSync = vi.mocked(readFileSync);
  const mockStatSync = vi.mocked(statSync);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  const mockGetStories = vi.fn();
  const mockUploadFile = vi.fn();
  const mockCreateAttachment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequireProject.mockReturnValue('myproject');
    mockRequireToken.mockReturnValue('token123');
    mockResolveBoard.mockReturnValue('all');

    vi.mocked(KlaroApi).mockImplementation(() => ({
      getStories: mockGetStories,
      uploadFile: mockUploadFile,
      createAttachment: mockCreateAttachment,
    }) as any);

    mockReadFileSync.mockReturnValue(Buffer.from('file-content'));
    mockStatSync.mockReturnValue({ size: 1024 } as any);
  });

  it('should attach a file to a card', async () => {
    mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
    mockUploadFile.mockResolvedValue('/s/abc123.jpg?n=photo.jpg');
    mockCreateAttachment.mockResolvedValue({
      id: 1,
      filename: 'photo.jpg',
      url: '/s/abc123.jpg?n=photo.jpg',
      isCover: false,
      sizeInBytes: 1024,
    });

    const cmd = createAttachCommand();
    await cmd.parseAsync(['node', 'test', '42', 'photo.jpg']);

    expect(KlaroApi).toHaveBeenCalledWith('myproject', 'token123', 'https://api.klaro.cards');
    expect(mockGetStories).toHaveBeenCalledWith('all', [42]);
    expect(mockUploadFile).toHaveBeenCalledWith(Buffer.from('file-content'), 'photo.jpg');
    expect(mockCreateAttachment).toHaveBeenCalledWith('999', {
      story: '999',
      filename: 'photo.jpg',
      url: '/s/abc123.jpg?n=photo.jpg',
      description: '',
      isCover: false,
      sizeInBytes: 1024,
    });
    expect(consoleSpy).toHaveBeenCalledWith('Attached photo.jpg to card 42');
  });

  it('should attach multiple files to a card', async () => {
    mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
    mockUploadFile
      .mockResolvedValueOnce('/s/abc.jpg?n=photo.jpg')
      .mockResolvedValueOnce('/s/def.pdf?n=doc.pdf');
    mockCreateAttachment.mockResolvedValue({ id: 1 });

    const cmd = createAttachCommand();
    await cmd.parseAsync(['node', 'test', '42', 'photo.jpg', 'doc.pdf']);

    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    expect(mockCreateAttachment).toHaveBeenCalledTimes(2);
    expect(mockCreateAttachment).toHaveBeenCalledWith('999', expect.objectContaining({ filename: 'photo.jpg' }));
    expect(mockCreateAttachment).toHaveBeenCalledWith('999', expect.objectContaining({ filename: 'doc.pdf' }));
    expect(consoleSpy).toHaveBeenCalledWith('Attached photo.jpg to card 42');
    expect(consoleSpy).toHaveBeenCalledWith('Attached doc.pdf to card 42');
  });

  it('should pass description and cover options', async () => {
    mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
    mockUploadFile.mockResolvedValue('/s/abc123.jpg?n=cover.jpg');
    mockCreateAttachment.mockResolvedValue({
      id: 1,
      filename: 'cover.jpg',
      url: '/s/abc123.jpg?n=cover.jpg',
      isCover: true,
      sizeInBytes: 1024,
    });

    const cmd = createAttachCommand();
    await cmd.parseAsync(['node', 'test', '42', 'cover.jpg', '-d', 'A cover image', '--cover']);

    expect(mockCreateAttachment).toHaveBeenCalledWith('999', {
      story: '999',
      filename: 'cover.jpg',
      url: '/s/abc123.jpg?n=cover.jpg',
      description: 'A cover image',
      isCover: true,
      sizeInBytes: 1024,
    });
  });

  it('should error when card is not found', async () => {
    mockGetStories.mockResolvedValue([]);

    const cmd = createAttachCommand();
    await cmd.parseAsync(['node', 'test', '99', 'file.txt']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Card 99 not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle API errors', async () => {
    mockGetStories.mockRejectedValue(new KlaroApiError(403, 'Forbidden'));

    const cmd = createAttachCommand();
    await cmd.parseAsync(['node', 'test', '42', 'file.txt']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Forbidden');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should extract basename from file path', async () => {
    mockGetStories.mockResolvedValue([{ id: 999, identifier: '42', title: 'Test card' }]);
    mockUploadFile.mockResolvedValue('/s/abc.pdf?n=report.pdf');
    mockCreateAttachment.mockResolvedValue({
      id: 1,
      filename: 'report.pdf',
      url: '/s/abc.pdf?n=report.pdf',
      isCover: false,
      sizeInBytes: 2048,
    });

    mockStatSync.mockReturnValue({ size: 2048 } as any);

    const cmd = createAttachCommand();
    await cmd.parseAsync(['node', 'test', '42', '/home/user/docs/report.pdf']);

    expect(mockUploadFile).toHaveBeenCalledWith(Buffer.from('file-content'), 'report.pdf');
    expect(mockCreateAttachment).toHaveBeenCalledWith('999', expect.objectContaining({
      filename: 'report.pdf',
      sizeInBytes: 2048,
    }));
  });
});
