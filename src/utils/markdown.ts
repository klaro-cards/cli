import { marked, MarkedExtension } from 'marked';
import { markedTerminal } from 'marked-terminal';

// Configure marked with terminal renderer
// Type assertion needed due to outdated @types/marked-terminal
marked.use(markedTerminal() as unknown as MarkedExtension);

/**
 * Render markdown text with terminal formatting (colors, styles).
 */
export function renderMarkdown(text: string): string {
  return marked.parse(text) as string;
}

/**
 * Extract YAML frontmatter from markdown content.
 *
 * @param markdown - Markdown content that may contain frontmatter
 * @returns Object with frontmatter (including delimiters) and content
 */
export function extractFrontmatter(markdown: string): { frontmatter: string; content: string } {
  if (!markdown.startsWith('---')) {
    return { frontmatter: '', content: markdown };
  }

  const endIndex = markdown.indexOf('---', 3);
  if (endIndex === -1) {
    return { frontmatter: '', content: markdown };
  }

  return {
    frontmatter: markdown.slice(0, endIndex + 3),
    content: markdown.slice(endIndex + 3).trim(),
  };
}

/**
 * Render markdown with terminal formatting, preserving YAML frontmatter as-is.
 * Frontmatter is not rendered as markdown but preserved verbatim.
 *
 * @param markdown - Markdown content that may contain frontmatter
 * @param raw - If true, return markdown unchanged
 * @returns Formatted string with frontmatter preserved
 */
export function renderMarkdownWithFrontmatter(markdown: string, raw: boolean): string {
  if (raw) {
    return markdown;
  }

  const { frontmatter, content } = extractFrontmatter(markdown);
  const renderedContent = renderMarkdown(content);

  if (frontmatter) {
    return frontmatter + '\n\n' + renderedContent;
  }
  return renderedContent;
}
