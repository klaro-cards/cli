import { Command } from 'commander';
import { requireProject } from '../lib/config.js';
import {
  setProjectDefault,
  unsetProjectDefault,
  listProjectDefaults,
  getProjectDefaults,
} from '../lib/defaults.js';
import type { ProjectDefaults } from '../lib/types.js';

function setAction(
  key: string,
  value: string,
  _options: unknown,
  command: Command
): void {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);

    if (!isValidKey(key)) {
      console.error(`Error: Unknown option "${key}". Valid options: board, dims`);
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

function unsetAction(key: string, _options: unknown, command: Command): void {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);

    if (!isValidKey(key)) {
      console.error(`Error: Unknown option "${key}". Valid options: board, dims`);
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

function listAction(_options: unknown, command: Command): void {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
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
  return key === 'board' || key === 'dims';
}

export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('Manage project configuration and defaults');

  cmd.addCommand(
    new Command('set')
      .description('Set a default option value for the current project')
      .argument('<key>', 'Option name (board or dims)')
      .argument('<value>', 'Default value')
      .action(setAction)
  );

  cmd.addCommand(
    new Command('unset')
      .description('Remove a default option value for the current project')
      .argument('<key>', 'Option name to remove (board or dims)')
      .action(unsetAction)
  );

  cmd.addCommand(
    new Command('list')
      .description('List all default option values for the current project')
      .action(listAction)
  );

  return cmd;
}
