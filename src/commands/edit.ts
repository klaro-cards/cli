import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { resolveBoard } from '../lib/defaults.js';
import { formatStoryMarkdown, parseStoryMarkdown } from '../utils/story-markdown.js';
import { openInEditor } from '../utils/editor.js';

interface EditOptions {
  board?: string;
  project?: string;
}

async function editAction(identifier: string, options: EditOptions): Promise<void> {
  try {
    const numericId = parseInt(identifier, 10);
    if (isNaN(numericId)) {
      console.error(`Error: Invalid identifier "${identifier}": must be a number`);
      process.exit(1);
      return;
    }

    const project = requireProject(options.project);
    const token = requireToken();
    const board = resolveBoard(options.board, project);

    const api = createClient(project, token);

    // Fetch the story
    const stories = await api.getStories(board, [numericId]);
    if (stories.length === 0) {
      console.error('No card found with the specified identifier');
      process.exit(1);
      return;
    }

    const story = stories[0];

    // Format as markdown and open in editor
    const markdown = formatStoryMarkdown(story);
    const edited = openInEditor(markdown, `card-${identifier}.md`);

    if (edited === null) {
      console.error('Editor exited with an error');
      process.exit(1);
      return;
    }

    // Check if content changed
    if (edited.trim() === markdown.trim()) {
      console.log('No changes made.');
      return;
    }

    // Parse edited markdown
    let parsed;
    try {
      parsed = parseStoryMarkdown(edited);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('Error: Failed to parse edited content');
      }
      process.exit(1);
      return;
    }

    // Update the story
    const updates = [{
      identifier: numericId,
      title: parsed.title,
      specification: parsed.specification ?? '',
    }];

    await api.updateStories(board, updates);
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

export function createEditCommand(): Command {
  return new Command('edit')
    .description('Edit a card in your default editor')
    .argument('<identifier>', 'Card identifier to edit')
    .option('-b, --board <board>', 'Board identifier (default: "all")')
    .option('-p, --project <subdomain>', 'Project subdomain')
    .action(editAction);
}
