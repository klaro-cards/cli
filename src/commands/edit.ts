import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import type { UpdateStoryInput } from '../lib/types.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard, resolveShow } from '../lib/defaults.js';
import { editStoryInEditor } from '../utils/story-editor.js';

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

    const showOpt = resolveShow(globalOpts.show ?? options.show, project);
    const dimensions = showOpt?.split(',').map((d: string) => d.trim());

    // Process each story sequentially
    const results: UpdateResult[] = [];
    const updates: UpdateStoryInput[] = [];

    for (const story of stories) {
      const result = editStoryInEditor(story, dimensions);
      results.push({ identifier: story.identifier, ...result });
      if (result.update) {
        updates.push(result.update);
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
