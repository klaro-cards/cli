import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard, resolveDims } from '../lib/defaults.js';
import { parseDimensions } from '../utils/dimensions.js';
import { formatDimensionValues } from '../utils/format.js';
import { printTable } from '../utils/table.js';

interface LsCardsOptions {
  board?: string;
  limit?: string;
  dims?: string;
  filter?: string[];
}

async function lsCardsAction(options: LsCardsOptions, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);
    const dims = resolveDims(globalOpts.dims ?? options.dims, project);
    const limit = options.limit ? parseInt(options.limit, 10) : 20;
    const filters = parseDimensions(options.filter);

    const api = createClient(project, token);
    const stories = await api.listStories(board, { limit, filters });

    if (stories.length === 0) {
      console.log('No cards found.');
      return;
    }

    // Default columns plus any user-specified dims columns
    const columns = ['identifier', 'title'];
    if (dims) {
      columns.push(...dims.split(',').map(d => d.trim()));
    }

    printTable(stories, columns);

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

async function lsProjectsAction(_options: unknown, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();

    const api = createClient(project, token);
    const projects = await api.listProjects();

    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }

    const columns = ['subdomain', 'name'];
    printTable(projects, columns);

    console.log(`\nShowing ${projects.length} project(s)`);
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

async function lsBoardsAction(_options: unknown, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();

    const api = createClient(project, token);
    const boards = await api.listBoards();

    if (boards.length === 0) {
      console.log('No boards found.');
      return;
    }

    const columns = ['location', 'label'];
    printTable(boards, columns);

    console.log(`\nShowing ${boards.length} board(s)`);
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

const HIDDEN_DIMENSIONS = ['identifier', 'title', 'specification'];

async function lsDimensionsAction(_options: unknown, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();

    const api = createClient(project, token);
    const allDimensions = await api.listDimensions();
    const dimensions = allDimensions.filter(d => !HIDDEN_DIMENSIONS.includes(d.code));

    if (dimensions.length === 0) {
      console.log('No dimensions found.');
      return;
    }

    // Format values for display
    const dimensionsWithValues = dimensions.map(dim => ({
      ...dim,
      values: formatDimensionValues(dim.values),
    }));

    const columns = ['code', 'name', 'datatype', 'values'];
    printTable(dimensionsWithValues, columns);

    console.log(`\nShowing ${dimensions.length} dimension(s)`);
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

function createCardsSubcommand(isDefault = false): Command {
  const cmd = new Command('cards')
    .description('List cards in a board' + (isDefault ? ' (default)' : ''))
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-l, --limit <number>', 'Maximum number of cards to show', '20')
    .option('--dims <columns>', 'Dimensions to include (comma-separated)')
    .option('-f, --filter <key=value>', 'Filter cards (can be used multiple times)',
      (value, previous: string[]) => previous.concat([value]), [])
    .action(lsCardsAction);
  return cmd;
}

function createProjectsSubcommand(): Command {
  return new Command('projects')
    .description('List projects')
    .action(lsProjectsAction);
}

function createBoardsSubcommand(): Command {
  return new Command('boards')
    .description('List boards')
    .action(lsBoardsAction);
}

function createDimensionsSubcommand(): Command {
  return new Command('dimensions')
    .description('List dimensions')
    .action(lsDimensionsAction);
}

export function createLsCommand(): Command {
  const cmd = new Command('ls')
    .description('List cards, projects, boards, or dimensions');

  cmd.addCommand(createCardsSubcommand(true), { isDefault: true });
  cmd.addCommand(createProjectsSubcommand());
  cmd.addCommand(createBoardsSubcommand());
  cmd.addCommand(createDimensionsSubcommand());

  return cmd;
}
