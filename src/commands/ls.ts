import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { printTable } from '../utils/table.js';

interface LsOptions {
  project?: string;
  limit?: string;
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

    printTable(
      stories.map((s) => ({
        id: s.identifier || `#${s.id}`,
        title: s.title.length > 60 ? s.title.substring(0, 57) + '...' : s.title,
      })),
      [
        { header: 'Card #', key: 'id', width: 10 },
        { header: 'Title', key: 'title' },
      ]
    );

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
    .action(lsAction);
}
