import { Command } from 'commander';
import { readConfig, writeConfig } from '../lib/config.js';

function useAction(subdomain: string): void {
  if (!subdomain) {
    console.error('Subdomain is required.');
    process.exit(1);
  }

  // Basic validation: subdomain should be alphanumeric with hyphens
  if (!/^[a-z0-9-]+$/i.test(subdomain)) {
    console.error('Invalid subdomain format. Use only letters, numbers, and hyphens.');
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
