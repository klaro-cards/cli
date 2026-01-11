import { stringify, parse } from 'yaml';
import type { Story } from '../lib/types.js';

export interface ParsedStory {
  title: string;
  specification?: string;
  dimensions?: Record<string, unknown>;
}

/**
 * Format a story as markdown output.
 *
 * - toptitle: first line of the title
 * - summary: remaining lines of the title (if any)
 * - description: the specification field
 * - dimensions: optional array of dimension names to include as YAML frontmatter
 */
export function formatStoryMarkdown(story: Story, dimensions?: string[]): string {
  const lines: string[] = [];

  // Add YAML frontmatter if dimensions are specified
  if (dimensions && dimensions.length > 0) {
    const frontmatter: Record<string, unknown> = {};
    for (const dim of dimensions) {
      if (dim in story) {
        frontmatter[dim] = story[dim];
      }
    }
    if (Object.keys(frontmatter).length > 0) {
      lines.push('---');
      lines.push(stringify(frontmatter).trim());
      lines.push('---');
      lines.push('');
    }
  }

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
 * ---
 * dimension: value
 * ---
 *
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
  let content = markdown;
  let dimensions: Record<string, unknown> | undefined;

  // Check for YAML frontmatter
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('---', 3);
    if (endIndex !== -1) {
      const yamlContent = content.slice(3, endIndex).trim();
      if (yamlContent) {
        dimensions = parse(yamlContent) as Record<string, unknown>;
      }
      content = content.slice(endIndex + 3).trim();
    }
  }

  const lines = content.split('\n');

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
    return { title: toptitle, dimensions };
  }

  // Split by double newlines to find content blocks
  const blocks = rest.split(/\n\n+/).filter(b => b.trim());

  if (blocks.length === 0) {
    return { title: toptitle, dimensions };
  }

  if (blocks.length === 1) {
    // Single block is treated as description
    return {
      title: toptitle,
      specification: blocks[0].trim(),
      dimensions,
    };
  }

  // Multiple blocks: first is summary (part of title), rest is description
  const summary = blocks[0].trim();
  const description = blocks.slice(1).join('\n\n').trim();

  const title = summary ? `${toptitle}\n${summary}` : toptitle;

  return {
    title,
    specification: description || undefined,
    dimensions,
  };
}
