import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';
import { splitArgs, parseDimensions } from '../utils/dimensions.js';
import { printTable } from '../utils/table.js';

interface SetOptions {
  board?: string;
}

async function setAction(args: string[], options: SetOptions, command: Command): Promise<void> {
  try {
    // Split args into identifiers and key=value dimensions
    const { regularArgs, dimensionArgs } = splitArgs(args);

    if (regularArgs.length === 0) {
      console.error('Error: At least one identifier is required');
      process.exit(1);
      return;
    }

    const numericIds = regularArgs.map(id => {
      const num = parseInt(id, 10);
      if (isNaN(num)) {
        throw new Error(`Invalid identifier "${id}": must be a number`);
      }
      return num;
    });

    const dimensions = parseDimensions(dimensionArgs);
    if (Object.keys(dimensions).length === 0) {
      console.error('Error: At least one dimension is required (key=value)');
      process.exit(1);
      return;
    }

    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);

    const api = createClient(project, token);
    const updates = numericIds.map(identifier => ({ identifier, ...dimensions }));
    const stories = await api.updateStories(board, updates);

    if (stories.length > 0) {
      const columns = ['identifier', 'title', ...Object.keys(dimensions)];
      printTable(stories, columns);
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
    .argument('<args...>', 'Card identifier(s) followed by key=value dimension(s)')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .action(setAction);
}
