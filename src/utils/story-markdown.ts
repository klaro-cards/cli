import type { Story } from '../lib/types.js';

export interface ParsedStory {
  title: string;
  specification?: string;
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

/**
 * Parse markdown back into story fields.
 *
 * Format expected:
 * ```
 * # toptitle
 *
 * [summary - optional]
 *
 * [description - optional]
 * ```
 *
 * If two content blocks exist (separated by blank line), first is summary, second is description.
 * If only one content block exists, it's treated as description.
 */
export function parseStoryMarkdown(markdown: string): ParsedStory {
  const lines = markdown.split('\n');

  // Extract toptitle from first line
  const firstLine = lines[0] || '';
  if (!firstLine.startsWith('# ')) {
    throw new Error('Invalid format: first line must be a heading (# title)');
  }
  const toptitle = firstLine.slice(2).trim();

  // Skip the title line and find content blocks
  const rest = lines.slice(1).join('\n').trim();

  if (!rest) {
    // Title only
    return { title: toptitle };
  }

  // Split by double newlines to find content blocks
  const blocks = rest.split(/\n\n+/).filter(b => b.trim());

  if (blocks.length === 0) {
    return { title: toptitle };
  }

  if (blocks.length === 1) {
    // Single block is treated as description
    return {
      title: toptitle,
      specification: blocks[0].trim(),
    };
  }

  // Multiple blocks: first is summary (part of title), rest is description
  const summary = blocks[0].trim();
  const description = blocks.slice(1).join('\n\n').trim();

  const title = summary ? `${toptitle}\n${summary}` : toptitle;

  return {
    title,
    specification: description || undefined,
  };
}
