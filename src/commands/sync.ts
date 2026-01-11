import { Command } from 'commander';
import { readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, KlaroApiError } from '../lib/api.js';
import type { UpdateStoryInput } from '../lib/types.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';
import { parseStoryMarkdown } from '../utils/story-markdown.js';
import { getContentDir, listContentFiles, extractIdentifierFromFilename } from '../utils/content.js';

interface SyncOptions {
  board?: string;
  project?: string;
  keep?: boolean;
  dryRun?: boolean;
}

interface SyncResult {
  filename: string;
  identifier: number;
  synced: boolean;
  deleted: boolean;
  error?: string;
}

async function syncAction(options: SyncOptions, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(options.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);

    // Find content directory
    const contentDir = getContentDir(project);
    const files = listContentFiles(project);

    if (files.length === 0) {
      console.log('Nothing to sync.');
      return;
    }

    // Parse all files and build updates
    const results: SyncResult[] = [];
    const updates: UpdateStoryInput[] = [];
    const fileMap = new Map<number, string>(); // identifier -> filename

    for (const filename of files) {
      const identifier = extractIdentifierFromFilename(filename);
      if (identifier === null) {
        results.push({
          filename,
          identifier: 0,
          synced: false,
          deleted: false,
          error: 'Invalid filename format (expected {id}-{title}.md)',
        });
        continue;
      }

      const filepath = join(contentDir, filename);

      try {
        const content = readFileSync(filepath, 'utf-8');
        const parsed = parseStoryMarkdown(content);

        const update: UpdateStoryInput = {
          identifier,
          title: parsed.title,
          specification: parsed.specification ?? '',
        };

        // Add dimensions if present
        if (parsed.dimensions) {
          for (const [key, value] of Object.entries(parsed.dimensions)) {
            if (typeof value === 'string' || typeof value === 'number') {
              update[key] = value;
            }
          }
        }

        updates.push(update);
        fileMap.set(identifier, filename);
        results.push({
          filename,
          identifier,
          synced: false, // Will be set to true after API call
          deleted: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse file';
        results.push({
          filename,
          identifier,
          synced: false,
          deleted: false,
          error: message,
        });
      }
    }

    if (updates.length === 0) {
      console.log('No valid cards to sync.');
      return;
    }

    // Dry run: show what would be synced
    if (options.dryRun) {
      console.log('Dry run - would sync:');
      for (const update of updates) {
        const filename = fileMap.get(update.identifier);
        console.log(`  ${filename} (card ${update.identifier})`);
      }
      if (!options.keep) {
        console.log(`Would delete ${updates.length} file(s) after sync.`);
      }
      return;
    }

    // Submit updates to API
    const api = createClient(project, token);
    await api.updateStories(board, updates);

    // Mark successful syncs
    for (const update of updates) {
      const result = results.find(r => r.identifier === update.identifier);
      if (result) {
        result.synced = true;
      }
    }

    // Delete files (unless --keep)
    if (!options.keep) {
      for (const result of results) {
        if (result.synced) {
          try {
            const filepath = join(contentDir, result.filename);
            unlinkSync(filepath);
            result.deleted = true;
          } catch {
            // Ignore delete errors
          }
        }
      }
    }

    // Report results
    const synced = results.filter(r => r.synced);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      for (const r of errors) {
        console.error(`Error with ${r.filename}: ${r.error}`);
      }
    }

    if (synced.length === 0) {
      console.log('No cards synced.');
    } else if (synced.length === 1) {
      const msg = options.keep ? 'synced' : 'synced and deleted';
      console.log(`Card ${synced[0].identifier} ${msg}.`);
    } else {
      const msg = options.keep ? 'synced' : 'synced and deleted';
      console.log(`${synced.length} cards ${msg}.`);
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

export function createSyncCommand(): Command {
  return new Command('sync')
    .description('Upload local card changes and delete synced files')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('--keep', 'Keep local files after syncing')
    .option('--dry-run', 'Show what would be synced without making changes')
    .action(syncAction);
}
