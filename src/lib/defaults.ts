import { readConfig, writeConfig } from './config.js';
import type { ProjectDefaults } from './types.js';

const HARDCODED_DEFAULTS: ProjectDefaults = {
  board: 'all',
};

export function getProjectDefaults(project: string): ProjectDefaults {
  const config = readConfig();
  return config.projectDefaults?.[project] ?? {};
}

export function setProjectDefault(
  project: string,
  key: keyof ProjectDefaults,
  value: string
): void {
  const config = readConfig();
  if (!config.projectDefaults) {
    config.projectDefaults = {};
  }
  if (!config.projectDefaults[project]) {
    config.projectDefaults[project] = {};
  }
  config.projectDefaults[project][key] = value;
  writeConfig(config);
}

export function unsetProjectDefault(
  project: string,
  key: keyof ProjectDefaults
): void {
  const config = readConfig();
  if (config.projectDefaults?.[project]?.[key] !== undefined) {
    delete config.projectDefaults[project][key];
    if (Object.keys(config.projectDefaults[project]).length === 0) {
      delete config.projectDefaults[project];
    }
    if (Object.keys(config.projectDefaults).length === 0) {
      delete config.projectDefaults;
    }
    writeConfig(config);
  }
}

export function resolveOption<K extends keyof ProjectDefaults>(
  cliValue: ProjectDefaults[K] | undefined,
  projectDefaults: ProjectDefaults,
  key: K
): NonNullable<ProjectDefaults[K]> {
  if (cliValue !== undefined) {
    return cliValue as NonNullable<ProjectDefaults[K]>;
  }
  const projectValue = projectDefaults[key];
  if (projectValue !== undefined) {
    return projectValue as NonNullable<ProjectDefaults[K]>;
  }
  return HARDCODED_DEFAULTS[key] as NonNullable<ProjectDefaults[K]>;
}

export function resolveBoard(
  cliValue: string | undefined,
  project: string
): string {
  const defaults = getProjectDefaults(project);
  return resolveOption(cliValue, defaults, 'board');
}

export function resolveDims(
  cliValue: string | undefined,
  project: string
): string | undefined {
  if (cliValue !== undefined) {
    return cliValue;
  }
  const defaults = getProjectDefaults(project);
  return defaults.dims;
}

export function listProjectDefaults(project: string): ProjectDefaults {
  const projectDefaults = getProjectDefaults(project);
  return { ...HARDCODED_DEFAULTS, ...projectDefaults };
}
