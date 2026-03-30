import { Command } from 'commander';
import { requireProject, readConfig, writeConfig, getApiUrl } from '../lib/config.js';
import {
  setProjectDefault,
  unsetProjectDefault,
  listProjectDefaults,
  getProjectDefaults,
} from '../lib/defaults.js';
import type { ProjectDefaults } from '../lib/types.js';

const GLOBAL_KEYS = ['api_url'] as const;
type GlobalKey = typeof GLOBAL_KEYS[number];

function isGlobalKey(key: string): key is GlobalKey {
  return (GLOBAL_KEYS as readonly string[]).includes(key);
}

function isProjectKey(key: string): key is keyof ProjectDefaults {
  return key === 'board' || key === 'dims';
}

function isValidKey(key: string): boolean {
  return isProjectKey(key) || isGlobalKey(key);
}

function setAction(
  key: string,
  value: string,
  _options: unknown,
  command: Command
): void {
  try {
    if (!isValidKey(key)) {
      console.error(`Error: Unknown option "${key}". Valid options: board, dims, api_url`);
      process.exit(1);
      return;
    }

    if (isGlobalKey(key)) {
      const config = readConfig();
      config[key] = value;
      writeConfig(config);
      console.log(`Set ${key}="${value}"`);
      return;
    }

    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const projectKey = key as keyof ProjectDefaults;
    setProjectDefault(project, projectKey, value);
    console.log(`Set default ${key}="${value}" for project "${project}"`);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

function unsetAction(key: string, _options: unknown, command: Command): void {
  try {
    if (!isValidKey(key)) {
      console.error(`Error: Unknown option "${key}". Valid options: board, dims, api_url`);
      process.exit(1);
      return;
    }

    if (isGlobalKey(key)) {
      const config = readConfig();
      delete config[key];
      writeConfig(config);
      console.log(`Removed "${key}" (reset to default)`);
      return;
    }

    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const projectKey = key as keyof ProjectDefaults;
    unsetProjectDefault(project, projectKey);
    console.log(`Removed default for "${key}" from project "${project}"`);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

function listAction(_options: unknown, command: Command): void {
  try {
    // Show global settings
    const apiUrl = getApiUrl();
    const config = readConfig();
    const apiUrlSource = config.api_url ? '(configured)' : '(default)';
    console.log(`Global settings:\n`);
    console.log(`  api_url: ${apiUrl} ${apiUrlSource}`);

    // Show project defaults if a project is set
    const globalOpts = command.optsWithGlobals();
    let project: string | undefined;
    try {
      project = requireProject(globalOpts.project);
    } catch {
      // No project set, skip project defaults
    }

    if (project) {
      const defaults = listProjectDefaults(project);
      const projectDefaults = getProjectDefaults(project);

      console.log(`\nDefaults for project "${project}":\n`);

      for (const [key, value] of Object.entries(defaults)) {
        const source = projectDefaults[key as keyof ProjectDefaults] !== undefined
          ? '(configured)'
          : '(default)';
        console.log(`  ${key}: ${value} ${source}`);
      }
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('Manage project configuration and defaults');

  cmd.addCommand(
    new Command('set')
      .description('Set a configuration value (api_url is global, board/dims are per-project)')
      .argument('<key>', 'Option name (api_url, board, or dims)')
      .argument('<value>', 'Default value')
      .action(setAction)
  );

  cmd.addCommand(
    new Command('unset')
      .description('Remove a configuration value (api_url resets to default, board/dims are per-project)')
      .argument('<key>', 'Option name to remove (api_url, board, or dims)')
      .action(unsetAction)
  );

  cmd.addCommand(
    new Command('list')
      .description('List all configuration values')
      .action(listAction)
  );

  return cmd;
}
