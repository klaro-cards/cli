import { Command } from 'commander';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard, resolveShow } from '../lib/defaults.js';
import { formatStoryMarkdown } from '../utils/story-markdown.js';
import { ensureContentDir, buildContentFilename } from '../utils/content.js';

interface FetchOptions {
  board?: string;
  project?: string;
  show?: string;
  force?: boolean;
}

interface FetchResult {
  identifier: string;
  filename: string;
  written: boolean;
  skipped?: boolean;
  error?: string;
}

async function fetchAction(identifiers: string[], options: FetchOptions, command: Command): Promise<void> {
  try {
    if (identifiers.length === 0) {
      console.error('Error: At least one identifier is required');
      process.exit(1);
      return;
    }

    // Validate all identifiers upfront
    const numericIds = identifiers.map(id => {
      const num = parseInt(id, 10);
      if (isNaN(num)) {
        throw new Error(`Invalid identifier "${id}": must be a number`);
      }
      return num;
    });

    const globalOpts = command.optsWithGlobals();
    const project = requireProject(options.project);
    const token = requireToken();
    const board = resolveBoard(globalOpts.board ?? options.board, project);

    const api = createClient(project, token);

    // Fetch all stories in one API call
    const fetchedStories = await api.getStories(board, numericIds);
    if (fetchedStories.length === 0) {
      console.error('No cards found with the specified identifier(s)');
      process.exit(1);
      return;
    }

    // Ensure content directory exists
    const contentDir = ensureContentDir(project);

    // Resolve show dimensions
    const showOpt = resolveShow(globalOpts.show ?? options.show, project);
    const dimensions = showOpt?.split(',').map((d: string) => d.trim());

    // Process each story
    const results: FetchResult[] = [];

    for (const story of fetchedStories) {
      const filename = buildContentFilename(story.identifier, story.title);
      const filepath = join(contentDir, filename);

      // Check if file exists
      if (existsSync(filepath) && !options.force) {
        results.push({
          identifier: story.identifier,
          filename,
          written: false,
          skipped: true,
        });
        continue;
      }

      try {
        const markdown = formatStoryMarkdown(story, dimensions);
        writeFileSync(filepath, markdown, 'utf-8');
        results.push({
          identifier: story.identifier,
          filename,
          written: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to write file';
        results.push({
          identifier: story.identifier,
          filename,
          written: false,
          error: message,
        });
      }
    }

    // Report not found identifiers
    const foundIds = new Set(fetchedStories.map(s => String(s.identifier)));
    const notFound = numericIds.filter(id => !foundIds.has(String(id)));
    if (notFound.length > 0) {
      console.error(`Cards not found: ${notFound.join(', ')}`);
    }

    // Report results
    const written = results.filter(r => r.written);
    const skipped = results.filter(r => r.skipped);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      for (const r of errors) {
        console.error(`Error writing ${r.filename}: ${r.error}`);
      }
    }

    if (skipped.length > 0) {
      for (const r of skipped) {
        console.log(`Skipped ${r.filename} (already exists, use --force to overwrite)`);
      }
    }

    if (written.length === 0) {
      if (skipped.length === 0 && errors.length === 0) {
        console.log('No cards fetched.');
      }
    } else if (written.length === 1) {
      console.log(`Fetched card ${written[0].identifier} to ${written[0].filename}`);
    } else {
      console.log(`Fetched ${written.length} cards to ${contentDir}`);
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

export function createFetchCommand(): Command {
  return new Command('fetch')
    .description('Download cards as markdown files for offline editing')
    .argument('<identifiers...>', 'Card identifier(s) to fetch')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('--show <dimensions>', 'Include dimensions in YAML frontmatter (comma-separated)')
    .option('--force', 'Overwrite existing files')
    .action(fetchAction);
}
