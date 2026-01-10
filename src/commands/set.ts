import { Command } from 'commander';
import { Bmg } from '@enspirit/bmg-js';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';
import { parseDimensions } from '../utils/dimensions.js';

interface SetOptions {
  board?: string;
  project?: string;
  dimension?: string[];
}

async function setAction(identifiers: string[], options: SetOptions): Promise<void> {
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

    const dimensions = parseDimensions(options.dimension);
    if (Object.keys(dimensions).length === 0) {
      console.error('Error: At least one dimension is required');
      process.exit(1);
      return;
    }

    const project = requireProject(options.project);
    const token = requireToken();
    const board = resolveBoard(options.board, project);

    const api = createClient(project, token);
    const updates = numericIds.map(identifier => ({ identifier, ...dimensions }));
    const stories = await api.updateStories(board, updates);

    if (stories.length > 0) {
      const columns = ['identifier', 'title', ...Object.keys(dimensions)];
      const output = Bmg(stories).project(columns).toText();
      console.log(output);
    }
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

export function createSetCommand(): Command {
  return new Command('set')
    .description('Update one or more cards by identifier')
    .argument('<identifiers...>', 'Card identifier(s) to update')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('-d, --dimension <key=value>', 'Set a dimension value (can be used multiple times)',
      (value, previous: string[]) => previous.concat([value]), [])
    .action(setAction);
}
