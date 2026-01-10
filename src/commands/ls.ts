import { Command } from 'commander';
import { Bmg } from '@enspirit/bmg-js';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard, resolveShow } from '../lib/defaults.js';
import { parseDimensions } from '../utils/dimensions.js';

interface LsCardsOptions {
  board?: string;
  project?: string;
  limit?: string;
  show?: string;
  filter?: string[];
}

interface LsProjectsOptions {
  project?: string;
}

interface LsBoardsOptions {
  project?: string;
}

async function lsCardsAction(options: LsCardsOptions): Promise<void> {
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

async function lsProjectsAction(options: LsProjectsOptions): Promise<void> {
  try {
    const project = requireProject(options.project);
    const token = requireToken();

    const api = createClient(project, token);
    const projects = await api.listProjects();

    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }

    const columns = ['subdomain', 'name'];
    const output = Bmg(projects).project(columns).toText();
    console.log(output);

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

async function lsBoardsAction(options: LsBoardsOptions): Promise<void> {
  try {
    const project = requireProject(options.project);
    const token = requireToken();

    const api = createClient(project, token);
    const boards = await api.listBoards();

    if (boards.length === 0) {
      console.log('No boards found.');
      return;
    }

    const columns = ['location', 'label'];
    const output = Bmg(boards).project(columns).toText();
    console.log(output);

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

function createCardsSubcommand(isDefault = false): Command {
  const cmd = new Command('cards')
    .description('List cards in a board' + (isDefault ? ' (default)' : ''))
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('-l, --limit <number>', 'Maximum number of cards to show', '20')
    .option('--show <columns>', 'Additional columns to show (comma-separated)')
    .option('-f, --filter <key=value>', 'Filter cards (can be used multiple times)',
      (value, previous: string[]) => previous.concat([value]), [])
    .action(lsCardsAction);
  return cmd;
}

function createProjectsSubcommand(): Command {
  return new Command('projects')
    .description('List projects')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .action(lsProjectsAction);
}

function createBoardsSubcommand(): Command {
  return new Command('boards')
    .description('List boards')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .action(lsBoardsAction);
}

export function createLsCommand(): Command {
  const cmd = new Command('ls')
    .description('List cards, projects, or boards');

  cmd.addCommand(createCardsSubcommand(true), { isDefault: true });
  cmd.addCommand(createProjectsSubcommand());
  cmd.addCommand(createBoardsSubcommand());

  return cmd;
}
