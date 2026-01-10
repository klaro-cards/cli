import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Config } from './types.js';

const CONFIG_DIR = join(homedir(), '.klaro');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function readConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as Config;
  } catch {
    return {};
  }
}

export function writeConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getProject(cliOption?: string): string | undefined {
  if (cliOption) {
    return cliOption;
  }
  const config = readConfig();
  return config.project;
}

export function getToken(): string | undefined {
  const config = readConfig();
  return config.token;
}

export function requireProject(cliOption?: string): string {
  const project = getProject(cliOption);
  if (!project) {
    throw new Error(
      'No project specified. Use -p/--project option or run "klaro use <subdomain>" to set a default project.'
    );
  }
  return project;
}

export function requireToken(): string {
  const token = getToken();
  if (!token) {
    throw new Error('Not logged in. Run "klaro login" first.');
  }
  return token;
}
