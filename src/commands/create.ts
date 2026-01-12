import { Command } from 'commander';
import { readFileSync } from 'fs';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard, resolveDims } from '../lib/defaults.js';
import { splitArgs, parseDimensions } from '../utils/dimensions.js';
import { editStoryInEditor } from '../utils/story-editor.js';
import { printTable } from '../utils/table.js';
import { parseStoryMarkdown } from '../utils/story-markdown.js';

interface CreateOptions {
  board?: string;
  dims?: string;
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

async function createAction(args: string[], options: CreateOptions, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);

    // Split args into title/file and key=value dimensions
    const { regularArgs, dimensionArgs } = splitArgs(args);
    const titleOrFile = regularArgs[0];
    const cliDimensions = parseDimensions(dimensionArgs);

    let title: string;
    let specification: string | undefined;
    let fileDimensions: Record<string, unknown> = {};

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
      const dimsOpt = resolveDims(globalOpts.dims ?? options.dims, project);
      const dimensions = dimsOpt?.split(',').map((d: string) => d.trim());
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
      const dimsOpt = resolveDims(globalOpts.dims ?? options.dims, project);
      const dimColumns = dimsOpt?.split(',').map((d: string) => d.trim()) ?? [];
      const columns = ['identifier', 'title', ...dimColumns];
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
    .argument('[args...]', 'Card title (or @file.md), followed by optional key=value dimensions')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('--dims <dimensions>', 'Dimensions to include (comma-separated)')
    .option('-e, --edit', 'Open the card in editor immediately after creation')
    .action(createAction);
}
