import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';
import { renderMarkdown } from '../utils/markdown.js';
import type { Story } from '../lib/types.js';

interface ReadOptions {
  board?: string;
  project?: string;
}

/**
 * Format a story as markdown output.
 *
 * - toptitle: first line of the title
 * - summary: remaining lines of the title (if any)
 * - description: the specification field
 */
export function formatStoryMarkdown(story: Story): string {
  const lines: string[] = [];

  // Split title into toptitle and summary
  const titleLines = story.title.split('\n');
  const toptitle = titleLines[0];
  const summary = titleLines.slice(1).join('\n').trim();

  // Header with toptitle
  lines.push(`# ${toptitle}`);
  lines.push('');

  // Summary if present
  if (summary) {
    lines.push(summary);
    lines.push('');
  }

  // Description (specification)
  if (story.specification) {
    lines.push(story.specification);
  }

  return lines.join('\n');
}

async function readAction(identifiers: string[], options: ReadOptions): Promise<void> {
  try {
    if (identifiers.length === 0) {
      console.error('Error: At least one identifier is required');
      process.exit(1);
      return;
    }

    const numericIds = identifiers.map(id => {
      const num = parseInt(id, 10);
      if (isNaN(num)) {
        throw new Error(`Invalid identifier "${id}": must be a number`);
      }
      return num;
    });

    const project = requireProject(options.project);
    const token = requireToken();
    const board = resolveBoard(options.board, project);

    const api = createClient(project, token);
    const stories = await api.getStories(board, numericIds);

    if (stories.length === 0) {
      console.error('No cards found with the specified identifier(s)');
      process.exit(1);
      return;
    }

    // Output each story as markdown with terminal highlighting
    const markdown = stories.map(formatStoryMarkdown).join('\n\n---\n\n');
    const output = renderMarkdown(markdown);
    process.stdout.write(output);
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

export function createReadCommand(): Command {
  return new Command('read')
    .description('Read one or more cards and display as markdown')
    .argument('<identifiers...>', 'Card identifier(s) to read')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .action(readAction);
}
