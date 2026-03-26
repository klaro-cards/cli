# Add `write` command for non-interactive card text editing

The `edit` command opens an interactive editor, which doesn't work for AI agents or scripts. Agents are forced to hack around it with `EDITOR="cp ..."` or use `fetch`/`sync`. We need a `write` command that accepts card text (title + specification) from stdin or a file, enabling non-interactive card editing.

## Plan

The `write` command will accept a card identifier and markdown content (from a file via `-f` or stdin), parse it using the existing `parseStoryMarkdown`, and update the card via the API. This reuses the same markdown format as `read`/`edit`/`fetch`/`sync`.

Usage examples:
- `klaro read 42 --raw | modify-somehow | klaro write 42` (pipe from stdin)
- `klaro write 42 -f card.md` (from file)
- `klaro write 42 -f -` (explicitly stdin)

## Todo

- [x] Create `src/utils/stdin.ts` with a `readStdin()` helper
- [x] Create `src/commands/write.ts` with the write command
- [x] Register the command in `src/index.ts` and add to help categories
- [x] Write unit tests
- [x] Run tests and verify everything passes

## Changes

- Added `src/utils/stdin.ts` — `readStdin()` helper for consuming stdin as a string
- Added `src/commands/write.ts` — `write` command that accepts a card identifier and markdown from stdin or file (`-f`), parses it with `parseStoryMarkdown`, and updates via the API. Exports `buildUpdate` as a pure, testable function.
- Registered the command in `src/index.ts` under "Cards (and other objects)" category
- Added `tests/commands/write.test.ts` (11 tests) and `tests/stdin.test.ts` (3 tests)
