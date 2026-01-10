import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Config } from './types.js';

function getConfigDir(): string {
  const home = process.env.KLARO_HOME ?? homedir();
  return join(home, '.klaro');
}

function getConfigFile(): string {
  return join(getConfigDir(), 'config.json');
}

export function getConfigPath(): string {
  return getConfigFile();
}

export function readConfig(): Config {
  const configFile = getConfigFile();
  if (!existsSync(configFile)) {
    return {};
  }
  try {
    const content = readFileSync(configFile, 'utf-8');
    return JSON.parse(content) as Config;
  } catch {
    return {};
  }
}

export function writeConfig(config: Config): void {
  const configDir = getConfigDir();
  const configFile = getConfigFile();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
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
