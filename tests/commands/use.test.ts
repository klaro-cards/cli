import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the config module
vi.mock('../../src/lib/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

import { readConfig, writeConfig } from '../../src/lib/config.js';
import { createUseCommand } from '../../src/commands/use.js';

describe('use command', () => {
  const mockReadConfig = vi.mocked(readConfig);
  const mockWriteConfig = vi.mocked(writeConfig);
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set project subdomain', async () => {
    mockReadConfig.mockReturnValue({});

    const cmd = createUseCommand();
    await cmd.parseAsync(['node', 'test', 'myproject']);

    expect(mockWriteConfig).toHaveBeenCalledWith({ project: 'myproject' });
    expect(consoleSpy).toHaveBeenCalledWith('Default project set to "myproject"');
  });

  it('should show message when switching projects', async () => {
    mockReadConfig.mockReturnValue({ project: 'oldproject' });

    const cmd = createUseCommand();
    await cmd.parseAsync(['node', 'test', 'newproject']);

    expect(mockWriteConfig).toHaveBeenCalledWith({ project: 'newproject' });
    expect(consoleSpy).toHaveBeenCalledWith('Switched from "oldproject" to "newproject"');
  });

  it('should reject invalid subdomain format', async () => {
    const cmd = createUseCommand();
    await cmd.parseAsync(['node', 'test', 'invalid_subdomain!']);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid subdomain'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
