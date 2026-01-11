import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Config, Secrets } from './types.js';

const CONFIG_FILE = 'config.json';
const SECRETS_FILE = 'secrets.json';

function getGlobalConfigDir(): string {
  const home = process.env.KLARO_HOME ?? homedir();
  return join(home, '.klaro');
}

function getLocalConfigDir(): string {
  return join(process.cwd(), '.klaro');
}

function findConfigDir(): string {
  const localDir = getLocalConfigDir();
  if (existsSync(localDir)) {
    return localDir;
  }
  return getGlobalConfigDir();
}

export function getConfigDir(): string {
  return findConfigDir();
}

function getConfigFile(): string {
  return join(getConfigDir(), CONFIG_FILE);
}

function getSecretsFile(): string {
  return join(getConfigDir(), SECRETS_FILE);
}

export function getConfigPath(): string {
  return getConfigFile();
}

export function getSecretsPath(): string {
  return getSecretsFile();
}

export function isUsingLocalConfig(): boolean {
  return existsSync(getLocalConfigDir());
}

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(filePath: string, data: unknown): void {
  const dir = join(filePath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as object,
        sourceValue as object
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }
  return result;
}

export function readConfig(): Config {
  const configFile = getConfigFile();
  const secretsFile = getSecretsFile();

  const config = readJsonFile<Omit<Config, 'token'>>(configFile) ?? {};
  const secrets = readJsonFile<Secrets>(secretsFile) ?? {};

  return deepMerge(config as Config, secrets);
}

export function writeConfig(config: Config): void {
  const configDir = getConfigDir();
  const configFile = join(configDir, CONFIG_FILE);
  const secretsFile = join(configDir, SECRETS_FILE);

  // Split config into public and secret parts
  const { token, ...publicConfig } = config;
  const secrets: Secrets = {};
  if (token !== undefined) {
    secrets.token = token;
  }

  // Ensure directory exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  // Write public config
  writeJsonFile(configFile, publicConfig);

  // Write secrets (only if there are secrets to write, or file already exists)
  if (Object.keys(secrets).length > 0 || existsSync(secretsFile)) {
    writeJsonFile(secretsFile, secrets);
  }
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
