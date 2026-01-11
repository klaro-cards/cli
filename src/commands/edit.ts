import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import type { UpdateStoryInput } from '../lib/types.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';
import { formatStoryMarkdown, parseStoryMarkdown } from '../utils/story-markdown.js';
import { openInEditor } from '../utils/editor.js';
import { slugify } from '../utils/slugify.js';

interface EditOptions {
  board?: string;
  project?: string;
  show?: string;
}

interface UpdateResult {
  identifier: string;
  changed: boolean;
  error?: string;
}

async function editAction(identifiers: string[], options: EditOptions, command: Command): Promise<void> {
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

    // Sort stories to match requested order
    const storyMap = new Map(fetchedStories.map(s => [String(s.identifier), s]));
    const stories = numericIds.map(id => storyMap.get(String(id))).filter(s => s !== undefined);

    const showOpt = globalOpts.show ?? options.show;
    const dimensions = showOpt?.split(',').map((d: string) => d.trim());

    // Process each story sequentially
    const results: UpdateResult[] = [];
    const updates: UpdateStoryInput[] = [];

    for (const story of stories) {
      const markdown = formatStoryMarkdown(story, dimensions);
      const filename = `${story.identifier}-${slugify(story.title)}.md`;
      const edited = openInEditor(markdown, filename);

      if (edited === null) {
        results.push({ identifier: story.identifier, changed: false, error: 'Editor exited with an error' });
        continue;
      }

      if (edited.trim() === markdown.trim()) {
        results.push({ identifier: story.identifier, changed: false });
        continue;
      }

      try {
        const parsed = parseStoryMarkdown(edited);
        const update: UpdateStoryInput = {
          identifier: parseInt(story.identifier, 10),
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
        results.push({ identifier: story.identifier, changed: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse edited content';
        results.push({ identifier: story.identifier, changed: false, error: message });
      }
    }

    // Submit all changes in one API call
    if (updates.length > 0) {
      await api.updateStories(board, updates);
    }

    // Report results
    const changedIds = results.filter(r => r.changed).map(r => r.identifier);
    const errorResults = results.filter(r => r.error);

    if (errorResults.length > 0) {
      for (const r of errorResults) {
        console.error(`Error on card ${r.identifier}: ${r.error}`);
      }
    }

    if (changedIds.length === 0) {
      console.log('No changes made.');
    } else if (changedIds.length === 1) {
      console.log(`Card ${changedIds[0]} updated successfully.`);
    } else {
      console.log(`Cards ${changedIds.join(', ')} updated successfully.`);
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

export function createEditCommand(): Command {
  return new Command('edit')
    .description('Edit one or more cards in your default editor')
    .argument('<identifiers...>', 'Card identifier(s) to edit')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('--show <dimensions>', 'Include dimensions in YAML frontmatter (comma-separated)')
    .action(editAction);
}
