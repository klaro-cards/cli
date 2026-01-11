import { describe, it, expect } from 'vitest';
import { renderMarkdown, extractFrontmatter, renderMarkdownWithFrontmatter } from '../src/utils/markdown.js';

describe('renderMarkdown', () => {
  it('returns a string', () => {
    const result = renderMarkdown('# Hello');
    expect(typeof result).toBe('string');
  });

  it('preserves basic text content', () => {
    const result = renderMarkdown('Hello world');
    expect(result).toContain('Hello world');
  });

  it('handles empty string', () => {
    const result = renderMarkdown('');
    expect(typeof result).toBe('string');
  });

  it('handles code blocks', () => {
    const result = renderMarkdown('```js\nconst x = 1;\n```');
    // Output contains ANSI color codes, so check for parts that appear
    expect(result).toContain('x = 1');
  });

  it('handles lists', () => {
    const result = renderMarkdown('- item 1\n- item 2');
    expect(result).toContain('item 1');
    expect(result).toContain('item 2');
  });
});

describe('extractFrontmatter', () => {
  it('returns empty frontmatter for content without frontmatter', () => {
    const result = extractFrontmatter('# Hello\n\nWorld');
    expect(result.frontmatter).toBe('');
    expect(result.content).toBe('# Hello\n\nWorld');
  });

  it('extracts frontmatter from content', () => {
    const markdown = '---\ntitle: Test\n---\n\n# Hello';
    const result = extractFrontmatter(markdown);
    expect(result.frontmatter).toBe('---\ntitle: Test\n---');
    expect(result.content).toBe('# Hello');
  });

  it('handles frontmatter without trailing content', () => {
    const markdown = '---\nkey: value\n---';
    const result = extractFrontmatter(markdown);
    expect(result.frontmatter).toBe('---\nkey: value\n---');
    expect(result.content).toBe('');
  });

  it('handles unclosed frontmatter', () => {
    const markdown = '---\nkey: value\n# Not closed';
    const result = extractFrontmatter(markdown);
    expect(result.frontmatter).toBe('');
    expect(result.content).toBe(markdown);
  });

  it('handles empty string', () => {
    const result = extractFrontmatter('');
    expect(result.frontmatter).toBe('');
    expect(result.content).toBe('');
  });
});

describe('renderMarkdownWithFrontmatter', () => {
  it('returns raw markdown when raw is true', () => {
    const markdown = '---\nkey: value\n---\n\n# Hello';
    const result = renderMarkdownWithFrontmatter(markdown, true);
    expect(result).toBe(markdown);
  });

  it('preserves frontmatter and renders content', () => {
    const markdown = '---\nkey: value\n---\n\n# Hello';
    const result = renderMarkdownWithFrontmatter(markdown, false);
    expect(result).toContain('---\nkey: value\n---');
    expect(result).toContain('Hello');
  });

  it('renders content without frontmatter', () => {
    const markdown = '# Hello World';
    const result = renderMarkdownWithFrontmatter(markdown, false);
    expect(result).toContain('Hello World');
    expect(result).not.toContain('---');
  });
});
