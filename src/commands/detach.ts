import { Command } from 'commander';
import { KlaroApi, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken, getApiUrl } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';

interface DetachOptions {
  board?: string;
  keepFile?: boolean;
}

function isSeshatUrl(value: string): boolean {
  return value.startsWith('/s/');
}

export async function detachAction(identifier: string, attachment: string, options: DetachOptions, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);

    const api = new KlaroApi(project, token, getApiUrl());

    // Resolve card identifier to story ID
    const stories = await api.getStories(board, [Number(identifier)]);
    if (stories.length === 0) {
      console.error(`Error: Card ${identifier} not found`);
      process.exit(1);
      return;
    }
    const storyId = String(stories[0].id);

    // Find the attachment by UUID or seshat URL
    const attachments = await api.listAttachments(storyId);
    const found = isSeshatUrl(attachment)
      ? attachments.find(a => a.url === attachment)
      : attachments.find(a => a.id === attachment);
    if (!found) {
      console.error(`Error: Attachment "${attachment}" not found on card ${identifier}`);
      process.exit(1);
      return;
    }

    // Delete the seshat file unless --keep-file is set
    if (!options.keepFile) {
      await api.deleteSeshatFile(found.url);
    }

    // Delete the attachment record
    await api.deleteAttachment(storyId, found.id);

    console.log(`Detached ${found.filename} from card ${identifier}`);
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

export function createDetachCommand(): Command {
  return new Command('detach')
    .description('Remove an attachment from a card')
    .argument('<identifier>', 'Card identifier (number)')
    .argument('<attachment>', 'Attachment UUID or seshat URL (/s/...)')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('--keep-file', 'Keep the uploaded file in seshat (only remove the attachment record)')
    .action(detachAction);
}
