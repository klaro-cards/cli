import { Command } from 'commander';
import { readFileSync, statSync } from 'fs';
import { basename } from 'path';
import { KlaroApi, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';

interface AttachOptions {
  board?: string;
  description?: string;
  cover?: boolean;
}

export async function attachAction(identifier: string, filePath: string, options: AttachOptions, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);

    const filename = basename(filePath);
    const fileBuffer = readFileSync(filePath);
    const sizeInBytes = statSync(filePath).size;

    const api = new KlaroApi(project, token);

    // Resolve card identifier to story ID
    const stories = await api.getStories(board, [Number(identifier)]);
    if (stories.length === 0) {
      console.error(`Error: Card ${identifier} not found`);
      process.exit(1);
      return;
    }
    const storyId = String(stories[0].id);

    // Upload file to seshat
    const url = await api.uploadFile(fileBuffer, filename);

    // Create the attachment on the story
    const attachment = await api.createAttachment(storyId, {
      story: storyId,
      filename,
      url,
      description: options.description || '',
      isCover: options.cover || false,
      sizeInBytes,
    });

    console.log(`Attached ${filename} to card ${identifier} (${attachment.url})`);
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

export function createAttachCommand(): Command {
  return new Command('attach')
    .description('Attach a file to a card')
    .argument('<identifier>', 'Card identifier (number)')
    .argument('<file>', 'Path to the file to attach')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-d, --description <text>', 'Attachment description')
    .option('--cover', 'Set attachment as card cover image')
    .action(attachAction);
}
