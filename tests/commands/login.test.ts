import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { credentialsFromEnv } from '../../src/commands/login.js';

describe('credentialsFromEnv', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  let originalLogin: string | undefined;
  let originalPassword: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalLogin = process.env.KLARO_LOGIN;
    originalPassword = process.env.KLARO_PASSWORD;
  });

  afterEach(() => {
    if (originalLogin !== undefined) process.env.KLARO_LOGIN = originalLogin;
    else delete process.env.KLARO_LOGIN;
    if (originalPassword !== undefined) process.env.KLARO_PASSWORD = originalPassword;
    else delete process.env.KLARO_PASSWORD;
  });

  it('returns credentials from environment variables', () => {
    process.env.KLARO_LOGIN = 'user@example.com';
    process.env.KLARO_PASSWORD = 'secret';

    const result = credentialsFromEnv();

    expect(result).toEqual({ email: 'user@example.com', password: 'secret' });
  });

  it('exits when KLARO_LOGIN is missing', () => {
    delete process.env.KLARO_LOGIN;
    process.env.KLARO_PASSWORD = 'secret';

    credentialsFromEnv();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'KLARO_LOGIN and KLARO_PASSWORD environment variables are required when using --env.'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when KLARO_PASSWORD is missing', () => {
    process.env.KLARO_LOGIN = 'user@example.com';
    delete process.env.KLARO_PASSWORD;

    credentialsFromEnv();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'KLARO_LOGIN and KLARO_PASSWORD environment variables are required when using --env.'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when both variables are missing', () => {
    delete process.env.KLARO_LOGIN;
    delete process.env.KLARO_PASSWORD;

    credentialsFromEnv();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
