import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';

interface CreateOptions {
  project?: string;
  title: string;
  dimension?: string[];
}

function parseDimensions(dimensionArgs?: string[]): Record<string, string> {
  const dimensions: Record<string, string> = {};

  if (!dimensionArgs) {
    return dimensions;
  }

  for (const arg of dimensionArgs) {
    const eqIndex = arg.indexOf('=');
    if (eqIndex === -1) {
      console.error(`Invalid dimension format: "${arg}". Expected format: key=value`);
      process.exit(1);
    }
    const key = arg.substring(0, eqIndex);
    const value = arg.substring(eqIndex + 1);
    dimensions[key] = value;
  }

  return dimensions;
}

async function createAction(board: string, options: CreateOptions): Promise<void> {
  try {
    const project = requireProject(options.project);
    const token = requireToken();

    if (!options.title) {
      console.error('Title is required. Use -t or --title to specify.');
      process.exit(1);
    }

    const dimensions = parseDimensions(options.dimension);

    const api = createClient(project, token);
    const story = await api.createStory(board, {
      title: options.title,
      dimensions,
    });

    console.log(`Card created successfully!`);
    console.log(`  ID: ${story.identifier || story.id}`);
    console.log(`  Title: ${story.title}`);

    if (Object.keys(dimensions).length > 0) {
      console.log(`  Dimensions:`);
      for (const [key, value] of Object.entries(dimensions)) {
        console.log(`    ${key}: ${value}`);
      }
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

export function createCreateCommand(): Command {
  return new Command('create')
    .description('Create a new card in a board')
    .argument('<board>', 'Board identifier')
    .requiredOption('-t, --title <title>', 'Card title')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('-d, --dimension <key=value>', 'Set a dimension value (can be used multiple times)',
      (value, previous: string[]) => previous.concat([value]), [])
    .action(createAction);
}
