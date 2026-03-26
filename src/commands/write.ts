import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { createClient, KlaroApiError } from '../lib/api.js';
import type { UpdateStoryInput } from '../lib/types.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';
import { parseStoryMarkdown } from '../utils/story-markdown.js';
import { readStdin } from '../utils/stdin.js';

interface WriteOptions {
  board?: string;
  file?: string;
}

export function buildUpdate(identifier: number, markdown: string): UpdateStoryInput {
  const parsed = parseStoryMarkdown(markdown);
  const update: UpdateStoryInput = {
    identifier,
    title: parsed.title,
    specification: parsed.specification ?? '',
  };
  if (parsed.dimensions) {
    for (const [key, value] of Object.entries(parsed.dimensions)) {
      if (typeof value === 'string' || typeof value === 'number') {
        update[key] = value;
      }
    }
  }
  return update;
}

async function readContent(file?: string): Promise<string> {
  if (file && file !== '-') {
    return readFileSync(file, 'utf-8');
  }
  return readStdin();
}

async function writeAction(identifier: string, options: WriteOptions, command: Command): Promise<void> {
  try {
    const num = parseInt(identifier, 10);
    if (isNaN(num)) {
      throw new Error(`Invalid identifier "${identifier}": must be a number`);
    }

    const content = await readContent(options.file);
    if (!content.trim()) {
      console.error('Error: No content provided');
      process.exit(1);
      return;
    }

    const update = buildUpdate(num, content);

    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);

    const api = createClient(project, token);
    await api.updateStories(board, [update]);

    console.log(`Card ${identifier} updated successfully.`);
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

export function createWriteCommand(): Command {
  return new Command('write')
    .description('Update a card from markdown content (stdin or file)')
    .argument('<identifier>', 'Card identifier to update')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-f, --file <path>', 'Read markdown from file (use "-" for stdin)')
    .action(writeAction);
}
