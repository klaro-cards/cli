import { describe, it, expect, vi, beforeEach } from 'vitest';
import { editStoryInEditor } from '../src/utils/story-editor.js';
import { openInEditor } from '../src/utils/editor.js';
import type { Story } from '../src/lib/types.js';

vi.mock('../src/utils/editor.js', () => ({
  openInEditor: vi.fn(),
}));

describe('editStoryInEditor', () => {
  const mockOpenInEditor = vi.mocked(openInEditor);

  const baseStory: Story = {
    id: 1,
    identifier: '42',
    title: 'Test card',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when editor fails', () => {
    mockOpenInEditor.mockReturnValue(null);

    const result = editStoryInEditor(baseStory);

    expect(result.changed).toBe(false);
    expect(result.error).toBe('Editor exited with an error');
    expect(result.update).toBeUndefined();
  });

  it('returns unchanged when content is not modified', () => {
    const markdown = '# Test card\n';
    mockOpenInEditor.mockReturnValue(markdown);

    const result = editStoryInEditor(baseStory);

    expect(result.changed).toBe(false);
    expect(result.error).toBeUndefined();
    expect(result.update).toBeUndefined();
  });

  it('returns update when content is modified', () => {
    mockOpenInEditor.mockReturnValue('# Updated title\n\nNew description');

    const result = editStoryInEditor(baseStory);

    expect(result.changed).toBe(true);
    expect(result.update).toEqual({
      identifier: 42,
      title: 'Updated title',
      specification: 'New description',
    });
  });

  it('includes dimensions in update when present', () => {
    mockOpenInEditor.mockReturnValue('---\nprogress: done\n---\n\n# Updated title\n\nDescription');

    const result = editStoryInEditor(baseStory, ['progress']);

    expect(result.changed).toBe(true);
    expect(result.update).toEqual({
      identifier: 42,
      title: 'Updated title',
      specification: 'Description',
      progress: 'done',
    });
  });

  it('uses correct filename for editor', () => {
    mockOpenInEditor.mockReturnValue('# Test card\n');

    editStoryInEditor({ ...baseStory, title: 'My Test Card' });

    expect(mockOpenInEditor).toHaveBeenCalledWith(
      expect.any(String),
      '42-my-test-card.md'
    );
  });

  it('handles story with specification', () => {
    const storyWithSpec: Story = {
      ...baseStory,
      specification: 'Original description',
    };
    mockOpenInEditor.mockReturnValue('# Test card\n\nOriginal description');

    const result = editStoryInEditor(storyWithSpec);

    expect(result.changed).toBe(false);
  });

  it('handles whitespace-only changes as no change', () => {
    mockOpenInEditor.mockReturnValue('# Test card\n  \n');

    const result = editStoryInEditor(baseStory);

    expect(result.changed).toBe(false);
  });
});
