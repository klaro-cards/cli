import { Command } from 'commander';
import { readConfig, writeConfig } from '../lib/config.js';
import { validateSubdomain } from '../utils/validation.js';

function useAction(subdomain: string): void {
  try {
    validateSubdomain(subdomain);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }

  const config = readConfig();
  const oldProject = config.project;
  config.project = subdomain;
  writeConfig(config);

  if (oldProject) {
    console.log(`Switched from "${oldProject}" to "${subdomain}"`);
  } else {
    console.log(`Default project set to "${subdomain}"`);
  }
}

export function createUseCommand(): Command {
  return new Command('use')
    .description('Set the default Klaro project')
    .argument('<subdomain>', 'Project subdomain')
    .action(useAction);
}
