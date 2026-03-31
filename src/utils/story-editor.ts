import type { Story, UpdateStoryInput } from '../lib/types.js';
import { formatStoryMarkdown, parseStoryMarkdown, toUpdateInput } from './story-markdown.js';
import { openInEditor } from './editor.js';
import { slugify } from './slugify.js';

export interface EditStoryResult {
  changed: boolean;
  update?: UpdateStoryInput;
  error?: string;
}

/**
 * Open a story in the editor and return the parsed changes.
 *
 * @param story - The story to edit
 * @param dimensions - Optional dimensions to include in YAML frontmatter
 * @returns Result object with changed flag, update data, or error
 */
export function editStoryInEditor(story: Story, dimensions?: string[]): EditStoryResult {
  const markdown = formatStoryMarkdown(story, dimensions);
  const filename = `${story.identifier}-${slugify(story.title)}.md`;
  const edited = openInEditor(markdown, filename);

  if (edited === null) {
    return { changed: false, error: 'Editor exited with an error' };
  }

  if (edited.trim() === markdown.trim()) {
    return { changed: false };
  }

  try {
    const parsed = parseStoryMarkdown(edited);
    const update = toUpdateInput(parsed, parseInt(story.identifier, 10));
    return { changed: true, update };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse edited content';
    return { changed: false, error: message };
  }
}
