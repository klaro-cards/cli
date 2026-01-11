import { Command } from 'commander';
import { readFileSync } from 'fs';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard, resolveShow } from '../lib/defaults.js';
import { parseDimensions } from '../utils/dimensions.js';
import { editStoryInEditor } from '../utils/story-editor.js';
import { printTable } from '../utils/table.js';
import { parseStoryMarkdown } from '../utils/story-markdown.js';

interface CreateOptions {
  board?: string;
  project?: string;
  dimension?: string[];
  show?: string;
  edit?: boolean;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function readFromFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

async function createAction(titleOrFile: string | undefined, options: CreateOptions, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(options.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);

    let title: string;
    let specification: string | undefined;
    let fileDimensions: Record<string, unknown> = {};
    const cliDimensions = parseDimensions(options.dimension);

    if (!titleOrFile) {
      // No argument - read from stdin
      if (process.stdin.isTTY) {
        console.error('Error: No title provided. Use a title argument, @file.md, or pipe content.');
        process.exit(1);
        return;
      }
      const content = await readStdin();
      const parsed = parseStoryMarkdown(content);
      title = parsed.title;
      specification = parsed.specification;
      fileDimensions = parsed.dimensions ?? {};
    } else if (titleOrFile.startsWith('@')) {
      // @file.md syntax - read from file
      const filePath = titleOrFile.slice(1);
      if (!filePath) {
        console.error('Error: No file path provided after @');
        process.exit(1);
        return;
      }
      const content = readFromFile(filePath);
      const parsed = parseStoryMarkdown(content);
      title = parsed.title;
      specification = parsed.specification;
      fileDimensions = parsed.dimensions ?? {};
    } else {
      // Plain title argument
      title = titleOrFile;
    }

    const api = createClient(project, token);
    const input = {
      title,
      specification,
      ...fileDimensions,
      ...cliDimensions,  // CLI dimensions override file dimensions
    };
    let story = await api.createStory(board, input);

    // If --edit flag is set, open the card in editor immediately
    if (options.edit) {
      const showOpt = resolveShow(globalOpts.show ?? options.show, project);
      const dimensions = showOpt?.split(',').map((d: string) => d.trim());
      const result = editStoryInEditor(story, dimensions);

      if (result.error) {
        console.error(result.error);
        process.exit(1);
        return;
      }

      if (result.changed && result.update) {
        const updated = await api.updateStories(board, [result.update]);
        story = updated[0];
        console.log(`Card ${story.identifier} created and updated.`);
      } else {
        console.log(`Card ${story.identifier} created (no edits made).`);
      }
    } else {
      // Display created card in table format (like ls does)
      const showOpt = resolveShow(globalOpts.show ?? options.show, project);
      const showDimensions = showOpt?.split(',').map((d: string) => d.trim()) ?? [];
      const columns = ['identifier', 'title', ...showDimensions];
      printTable([story], columns);
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
    .argument('[title]', 'Card title, or @file.md to read from file, or pipe from stdin')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('-d, --dimension <key=value>', 'Set a dimension value (can be used multiple times)',
      (value, previous: string[]) => previous.concat([value]), [])
    .option('--show <dimensions>', 'Dimensions to display in output (comma-separated)')
    .option('-e, --edit', 'Open the card in editor immediately after creation')
    .action(createAction);
}
