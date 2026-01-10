import { Command } from 'commander';
import { Bmg } from '@enspirit/bmg-js';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard, resolveShow } from '../lib/defaults.js';
import { parseDimensions } from '../utils/dimensions.js';

interface LsOptions {
  board?: string;
  project?: string;
  limit?: string;
  show?: string;
  filter?: string[];
}

async function lsAction(options: LsOptions): Promise<void> {
  try {
    const project = requireProject(options.project);
    const token = requireToken();
    const board = resolveBoard(options.board, project);
    const show = resolveShow(options.show, project);
    const limit = options.limit ? parseInt(options.limit, 10) : 20;
    const filters = parseDimensions(options.filter);

    const api = createClient(project, token);
    const stories = await api.listStories(board, { limit, filters });

    if (stories.length === 0) {
      console.log('No cards found.');
      return;
    }

    // Default columns plus any user-specified show columns
    const columns = ['identifier', 'title'];
    if (show) {
      columns.push(...show.split(',').map(d => d.trim()));
    }

    // Project to selected columns only
    const output = Bmg(stories).project(columns).toText();
    console.log(output);

    console.log(`\nShowing ${stories.length} card(s) in board ${board}`);
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
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('-l, --limit <number>', 'Maximum number of cards to show', '20')
    .option('--show <columns>', 'Additional columns to show (comma-separated)')
    .option('-f, --filter <key=value>', 'Filter cards (can be used multiple times)',
      (value, previous: string[]) => previous.concat([value]), [])
    .action(lsAction);
}
