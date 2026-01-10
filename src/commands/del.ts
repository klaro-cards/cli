import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';

interface DelOptions {
  board?: string;
  project?: string;
}

async function delAction(identifiers: string[], options: DelOptions): Promise<void> {
  try {
    if (identifiers.length === 0) {
      console.error('Error: At least one identifier is required');
      process.exit(1);
      return;
    }

    const numericIds = identifiers.map(id => {
      const num = parseInt(id, 10);
      if (isNaN(num)) {
        throw new Error(`Invalid identifier "${id}": must be a number`);
      }
      return num;
    });

    const project = requireProject(options.project);
    const token = requireToken();
    const board = resolveBoard(options.board, project);

    const api = createClient(project, token);
    await api.deleteStories(board, numericIds);

    const count = identifiers.length;
    const plural = count === 1 ? 'card' : 'cards';
    console.log(`Deleted ${count} ${plural}: ${identifiers.join(', ')}`);
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

export function createDelCommand(): Command {
  return new Command('del')
    .description('Delete one or more cards by identifier')
    .argument('<identifiers...>', 'Card identifier(s) to delete')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .action(delAction);
}
