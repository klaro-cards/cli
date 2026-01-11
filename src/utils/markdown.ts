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
