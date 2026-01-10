import { Command } from 'commander';
import { Bmg } from '@enspirit/bmg-js';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { parseDimensions } from '../utils/dimensions.js';

interface CreateOptions {
  project?: string;
  dimension?: string[];
}

async function createAction(board: string, title: string, options: CreateOptions): Promise<void> {
  try {
    const project = requireProject(options.project);
    const token = requireToken();

    const dimensions = parseDimensions(options.dimension);

    const api = createClient(project, token);
    const input = {
      title,
      ...dimensions,
    };
    const story = await api.createStory(board, input);

    // Display created card in table format (like ls does)
    const columns = ['identifier', 'title', ...Object.keys(dimensions)];
    const output = Bmg([story]).project(columns).toText();
    console.log(output);
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

export function createCreateCommand(): Command {
  return new Command('create')
    .description('Create a new card in a board')
    .argument('<board>', 'Board identifier')
    .argument('<title>', 'Card title')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('-d, --dimension <key=value>', 'Set a dimension value (can be used multiple times)',
      (value, previous: string[]) => previous.concat([value]), [])
    .action(createAction);
}
