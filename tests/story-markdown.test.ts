import { describe, it, expect } from 'vitest';
import { formatStoryMarkdown, parseStoryMarkdown } from '../src/utils/story-markdown.js';

describe('formatStoryMarkdown', () => {
  it('should format story with title only', () => {
    const story = { id: 1, identifier: '12', title: 'Simple title', createdAt: '', updatedAt: '' };
    const result = formatStoryMarkdown(story);
    expect(result).toBe('# Simple title\n');
  });

  it('should format story with multiline title (summary)', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Main title\nThis is a summary\nWith multiple lines',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story);
    expect(result).toBe('# Main title\n\nThis is a summary\nWith multiple lines\n');
  });

  it('should format story with specification (description)', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Card title',
      specification: 'This is the description\nwith details.',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story);
    expect(result).toBe('# Card title\n\nThis is the description\nwith details.');
  });

  it('should format story with title, summary, and description', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Main title\nSummary text here',
      specification: 'Full description follows.',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story);
    expect(result).toBe('# Main title\n\nSummary text here\n\nFull description follows.');
  });

  it('should include YAML frontmatter when dimensions are specified', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Card title',
      assignee: 'Claude',
      progress: 'doing',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story, ['assignee', 'progress']);
    expect(result).toContain('---');
    expect(result).toContain('assignee: Claude');
    expect(result).toContain('progress: doing');
    expect(result).toContain('# Card title');
  });

  it('should only include requested dimensions', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Card title',
      assignee: 'Claude',
      progress: 'doing',
      priority: 'high',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story, ['assignee']);
    expect(result).toContain('assignee: Claude');
    expect(result).not.toContain('progress');
    expect(result).not.toContain('priority');
  });

  it('should skip frontmatter if no dimensions match', () => {
    const story = {
      id: 1,
      identifier: '12',
      title: 'Card title',
      createdAt: '',
      updatedAt: '',
    };
    const result = formatStoryMarkdown(story, ['nonexistent']);
    expect(result).not.toContain('---');
    expect(result).toBe('# Card title\n');
  });
});

describe('parseStoryMarkdown', () => {
  it('should parse title only', () => {
    const markdown = '# Simple title\n';
    const result = parseStoryMarkdown(markdown);
    expect(result).toEqual({ title: 'Simple title' });
  });

  it('should parse title with description', () => {
    const markdown = '# Card title\n\nThis is the description.';
    const result = parseStoryMarkdown(markdown);
    expect(result).toEqual({
      title: 'Card title',
      specification: 'This is the description.',
    });
  });

  it('should parse title with summary and description', () => {
    const markdown = '# Main title\n\nSummary text here\n\nFull description follows.';
    const result = parseStoryMarkdown(markdown);
    expect(result).toEqual({
      title: 'Main title\nSummary text here',
      specification: 'Full description follows.',
    });
  });

  it('should parse multiline summary and description', () => {
    const markdown = '# Title\n\nSummary line 1\nSummary line 2\n\nDescription line 1\nDescription line 2';
    const result = parseStoryMarkdown(markdown);
    expect(result).toEqual({
      title: 'Title\nSummary line 1\nSummary line 2',
      specification: 'Description line 1\nDescription line 2',
    });
  });

  it('should handle multiple paragraphs in description', () => {
    const markdown = '# Title\n\nSummary\n\nParagraph 1\n\nParagraph 2';
    const result = parseStoryMarkdown(markdown);
    expect(result).toEqual({
      title: 'Title\nSummary',
      specification: 'Paragraph 1\n\nParagraph 2',
    });
  });

  it('should throw on invalid format (no heading)', () => {
    const markdown = 'No heading here';
    expect(() => parseStoryMarkdown(markdown)).toThrow('Invalid format: first line must be a heading');
  });

  it('should handle empty content after title', () => {
    const markdown = '# Title\n\n';
    const result = parseStoryMarkdown(markdown);
    expect(result).toEqual({ title: 'Title' });
  });

  it('should roundtrip format and parse with title only', () => {
    const story = { id: 1, identifier: '1', title: 'Test title', createdAt: '', updatedAt: '' };
    const markdown = formatStoryMarkdown(story);
    const parsed = parseStoryMarkdown(markdown);
    expect(parsed.title).toBe('Test title');
  });

  it('should roundtrip format and parse with title and description', () => {
    const story = {
      id: 1,
      identifier: '1',
      title: 'Test title',
      specification: 'Test description',
      createdAt: '',
      updatedAt: '',
    };
    const markdown = formatStoryMarkdown(story);
    const parsed = parseStoryMarkdown(markdown);
    expect(parsed.title).toBe('Test title');
    expect(parsed.specification).toBe('Test description');
  });

  it('should roundtrip format and parse with title, summary, and description', () => {
    const story = {
      id: 1,
      identifier: '1',
      title: 'Test title\nSummary here',
      specification: 'Test description',
      createdAt: '',
      updatedAt: '',
    };
    const markdown = formatStoryMarkdown(story);
    const parsed = parseStoryMarkdown(markdown);
    expect(parsed.title).toBe('Test title\nSummary here');
    expect(parsed.specification).toBe('Test description');
  });

  it('should parse YAML frontmatter', () => {
    const markdown = '---\nassignee: Claude\nprogress: doing\n---\n\n# Card title\n\nDescription here';
    const result = parseStoryMarkdown(markdown);
    expect(result.title).toBe('Card title');
    expect(result.specification).toBe('Description here');
    expect(result.dimensions).toEqual({ assignee: 'Claude', progress: 'doing' });
  });

  it('should handle empty frontmatter', () => {
    const markdown = '---\n---\n\n# Card title';
    const result = parseStoryMarkdown(markdown);
    expect(result.title).toBe('Card title');
    expect(result.dimensions).toBeUndefined();
  });

  it('should roundtrip with dimensions', () => {
    const story = {
      id: 1,
      identifier: '1',
      title: 'Test title',
      specification: 'Test description',
      assignee: 'Claude',
      progress: 'doing',
      createdAt: '',
      updatedAt: '',
    };
    const markdown = formatStoryMarkdown(story, ['assignee', 'progress']);
    const parsed = parseStoryMarkdown(markdown);
    expect(parsed.title).toBe('Test title');
    expect(parsed.specification).toBe('Test description');
    expect(parsed.dimensions).toEqual({ assignee: 'Claude', progress: 'doing' });
  });
});
