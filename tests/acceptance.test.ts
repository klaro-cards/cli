import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

/**
 * Acceptance tests that run the actual klaro CLI binary.
 *
 * Required environment variables:
 *   KCLI_USER      - Email address for login
 *   KCLI_PASSWORD  - Password for login
 *   KCLI_SUBDOMAIN - Project subdomain (e.g., 'klarocli-claude-test')
 *
 * Optional:
 *   KCLI_BOARD     - Board identifier to test with (defaults to 'backlog')
 *
 * IMPORTANT: Run `npm run build` before running these tests.
 *
 * Run with: KCLI_USER=... KCLI_PASSWORD=... KCLI_SUBDOMAIN=... npm test -- tests/acceptance.test.ts
 */

const USER = process.env.KCLI_USER;
const PASSWORD = process.env.KCLI_PASSWORD;
const SUBDOMAIN = process.env.KCLI_SUBDOMAIN;
const BOARD = process.env.KCLI_BOARD || 'backlog';

const canRun = USER && PASSWORD && SUBDOMAIN;

const CLI_PATH = resolve(import.meta.dirname, '../dist/index.js');

// Use a temporary directory for config to avoid affecting user's real ~/.klaro
const TEST_HOME = mkdtempSync(resolve(tmpdir(), 'klaro-test-'));

/**
 * Run a klaro CLI command and return stdout/stderr.
 */
function runCli(args: string[], options?: { timeout?: number }): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [CLI_PATH, ...args], {
      timeout: options?.timeout ?? 30000,
      env: { ...process.env, KLARO_HOME: TEST_HOME },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });

    proc.on('error', (err) => {
      resolve({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}

/**
 * Run klaro login with credentials piped to stdin.
 */
function runLogin(email: string, password: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [CLI_PATH, 'login'], {
      timeout: 30000,
      env: { ...process.env, KLARO_HOME: TEST_HOME },
    });

    let stdout = '';
    let stderr = '';
    let sentEmail = false;
    let sentPassword = false;

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      // When prompted for email, send it (only once)
      if (!sentEmail && stdout.includes('Email:')) {
        proc.stdin.write(email + '\n');
        sentEmail = true;
      }
      // When prompted for password, send it (only once)
      if (!sentPassword && stdout.includes('Password:')) {
        proc.stdin.write(password + '\n');
        proc.stdin.end(); // Close stdin after sending credentials
        sentPassword = true;
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });

    proc.on('error', (err) => {
      resolve({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}

describe.skipIf(!canRun)('CLI Acceptance tests', () => {
  // Ensure CLI is built
  beforeAll(() => {
    try {
      execSync('npm run build', { stdio: 'pipe' });
    } catch {
      throw new Error('Failed to build CLI. Run "npm run build" first.');
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    await runCli(['logout']);
    // Remove the temporary config directory
    rmSync(TEST_HOME, { recursive: true, force: true });
  });

  describe('klaro login', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await runLogin(USER!, PASSWORD!);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully logged in');
      expect(result.stdout).toContain(USER);
    }, 35000);
  });

  describe('klaro whoami', () => {
    it('should display the logged-in user email', async () => {
      const result = await runCli(['whoami']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(USER);
    });
  });

  describe('klaro use', () => {
    it('should set the current project', async () => {
      const result = await runCli(['use', SUBDOMAIN!]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(SUBDOMAIN);
    });
  });

  describe('klaro ls', () => {
    it('should list cards from a board', async () => {
      const result = await runCli(['ls', BOARD]);

      expect(result.exitCode).toBe(0);
      // Should show table headers or "No cards found"
      expect(result.stdout).toMatch(/identifier|No cards found/);
    });

    it('should accept --limit option', async () => {
      const result = await runCli(['ls', BOARD, '--limit', '5']);

      expect(result.exitCode).toBe(0);
    });

    it('should accept --project option to override subdomain', async () => {
      const result = await runCli(['ls', BOARD, '-p', SUBDOMAIN!]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('klaro create', () => {
    it('should create a card with a title', async () => {
      const timestamp = Date.now();
      const title = `CLI test card ${timestamp}`;

      const result = await runCli(['create', BOARD, title]);

      expect(result.exitCode).toBe(0);
      // Table output should contain identifier and title headers, plus the card data
      expect(result.stdout).toContain('identifier');
      expect(result.stdout).toContain('title');
      expect(result.stdout).toContain(title);
    });

    it('should create a card with dimensions', async () => {
      const timestamp = Date.now();
      const title = `CLI test card with dims ${timestamp}`;

      const result = await runCli(['create', BOARD, title, '-d', 'progress=todo']);

      expect(result.exitCode).toBe(0);
      // Table output should contain dimension column
      expect(result.stdout).toContain('identifier');
      expect(result.stdout).toContain('progress');
      expect(result.stdout).toContain('todo');
    });
  });

  describe('klaro logout', () => {
    it('should logout successfully', async () => {
      // First ensure we're logged in
      await runLogin(USER!, PASSWORD!);

      const result = await runCli(['logout']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Logged out');
    }, 35000);

    it('should show error when not logged in', async () => {
      // After logout, whoami should fail
      const result = await runCli(['whoami']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Not logged in');
    });
  });
});
