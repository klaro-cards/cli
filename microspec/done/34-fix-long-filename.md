# Fix ENAMETOOLONG error in edit command

## Status: DONE

## Problem
When editing a card with a very long title, the temp file path exceeds filesystem limits (255 chars) causing `ENAMETOOLONG` error.

## Idea
Truncate the filename to a safe maximum length before creating the temp file.

## Changes
- Updated `src/utils/editor.ts` to cap filename at 100 characters
- Long filenames are truncated and `.md` extension is preserved
