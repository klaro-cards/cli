## Edit card

The user would like to easily edit card in markdown format

## Idea

Let's add `klaro edit <identifier...>`.

Similar to read, but instead of showing the markdown, the cli would open the
default editor (same env var than git) on a temporary file with card content.

When saved, the markdown would be unparsed to extract title, summary and
description and would edit the card on the API.

## Technically

* If starting with only one identifier is easier, let's do that first
* `edit` should reuse logic from `read` and `set` command. No code duplication.

## Implementation

- Created `src/utils/story-markdown.ts` with:
  - `formatStoryMarkdown(story)` - formats story as markdown (moved from read.ts)
  - `parseStoryMarkdown(markdown)` - parses markdown back to title/specification
- Created `src/utils/editor.ts` with:
  - `getEditor()` - gets editor from $VISUAL or $EDITOR or 'vi'
  - `openInEditor(content, filename)` - opens content in editor, returns edited result
- Created `src/commands/edit.ts`:
  - Fetches card, opens in editor, parses result, updates via API
  - Detects "no changes" and skips update
  - Handles editor errors and invalid markdown format
- Added 14 tests for story-markdown, 8 tests for edit command
