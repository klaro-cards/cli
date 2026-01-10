import { Command } from 'commander';
import { requireProject } from '../lib/config.js';
import {
  setProjectDefault,
  unsetProjectDefault,
  listProjectDefaults,
  getProjectDefaults,
} from '../lib/defaults.js';
import type { ProjectDefaults } from '../lib/types.js';

interface ConfigOptions {
  project?: string;
}

function setAction(
  key: string,
  value: string,
  options: ConfigOptions
): void {
  try {
    const project = requireProject(options.project);

    if (!isValidKey(key)) {
      console.error(`Error: Unknown option "${key}". Valid options: board`);
      process.exit(1);
      return;
    }

    setProjectDefault(project, key, value);
    console.log(`Set default ${key}="${value}" for project "${project}"`);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

function unsetAction(key: string, options: ConfigOptions): void {
  try {
    const project = requireProject(options.project);

    if (!isValidKey(key)) {
      console.error(`Error: Unknown option "${key}". Valid options: board`);
      process.exit(1);
      return;
    }

    unsetProjectDefault(project, key);
    console.log(`Removed default for "${key}" from project "${project}"`);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

function listAction(options: ConfigOptions): void {
  try {
    const project = requireProject(options.project);
    const defaults = listProjectDefaults(project);
    const projectDefaults = getProjectDefaults(project);

    console.log(`Defaults for project "${project}":\n`);

    for (const [key, value] of Object.entries(defaults)) {
      const source = projectDefaults[key as keyof ProjectDefaults] !== undefined
        ? '(configured)'
        : '(default)';
      console.log(`  ${key}: ${value} ${source}`);
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

function isValidKey(key: string): key is keyof ProjectDefaults {
  return key === 'board';
}

export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('Manage project configuration and defaults');

  cmd.addCommand(
    new Command('set')
      .description('Set a default option value for the current project')
      .argument('<key>', 'Option name (e.g., board)')
      .argument('<value>', 'Default value')
      .option('-p, --project <subdomain>', 'Project subdomain')
      .action(setAction)
  );

  cmd.addCommand(
    new Command('unset')
      .description('Remove a default option value for the current project')
      .argument('<key>', 'Option name to remove')
      .option('-p, --project <subdomain>', 'Project subdomain')
      .action(unsetAction)
  );

  cmd.addCommand(
    new Command('list')
      .description('List all default option values for the current project')
      .option('-p, --project <subdomain>', 'Project subdomain')
      .action(listAction)
  );

  return cmd;
}
