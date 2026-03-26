import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';

describe('readStdin', () => {
  let originalStdin: typeof process.stdin;

  beforeEach(() => {
    originalStdin = process.stdin;
  });

  afterEach(() => {
    Object.defineProperty(process, 'stdin', { value: originalStdin, writable: true });
  });

  it('should read all chunks from stdin', async () => {
    const mockStdin = new EventEmitter();
    Object.defineProperty(process, 'stdin', { value: mockStdin, writable: true });

    const { readStdin } = await import('../src/utils/stdin.js');
    const promise = readStdin();

    mockStdin.emit('data', Buffer.from('hello '));
    mockStdin.emit('data', Buffer.from('world'));
    mockStdin.emit('end');

    const result = await promise;
    expect(result).toBe('hello world');
  });

  it('should handle empty stdin', async () => {
    const mockStdin = new EventEmitter();
    Object.defineProperty(process, 'stdin', { value: mockStdin, writable: true });

    const { readStdin } = await import('../src/utils/stdin.js');
    const promise = readStdin();

    mockStdin.emit('end');

    const result = await promise;
    expect(result).toBe('');
  });

  it('should reject on error', async () => {
    const mockStdin = new EventEmitter();
    Object.defineProperty(process, 'stdin', { value: mockStdin, writable: true });

    const { readStdin } = await import('../src/utils/stdin.js');
    const promise = readStdin();

    mockStdin.emit('error', new Error('stdin error'));

    await expect(promise).rejects.toThrow('stdin error');
  });
});
