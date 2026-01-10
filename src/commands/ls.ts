import { Command } from 'commander';
import { Bmg } from '@enspirit/bmg-js';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';

interface LsOptions {
  project?: string;
  limit?: string;
  dimensions?: string;
}

async function lsAction(board: string, options: LsOptions): Promise<void> {
  try {
    const project = requireProject(options.project);
    const token = requireToken();
    const limit = options.limit ? parseInt(options.limit, 10) : 20;

    const api = createClient(project, token);
    const stories = await api.listStories(board, { limit });

    if (stories.length === 0) {
      console.log('No cards found.');
      return;
    }

    // Default columns plus any user-specified dimensions
    const columns = ['identifier', 'title'];
    if (options.dimensions) {
      columns.push(...options.dimensions.split(',').map(d => d.trim()));
    }

    // Project to selected columns only
    const output = Bmg(stories).project(columns).toText();
    console.log(output);

    console.log(`\nShowing ${stories.length} card(s)`);
  } catch (error) {
    if (error instanceof KlaroApiError) {
      console.error(`Error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

export function createLsCommand(): Command {
  return new Command('ls')
    .description('List cards in a board')
    .argument('<board>', 'Board identifier')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('-l, --limit <number>', 'Maximum number of cards to show', '20')
    .option('-d, --dimensions <dims>', 'Additional dimensions to show (comma-separated)')
    .action(lsAction);
}
