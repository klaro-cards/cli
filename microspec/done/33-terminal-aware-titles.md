# Terminal-aware title truncation

## Status: DONE

## Problem
When card titles are long, the `ls` table wraps and becomes ugly/unreadable.

## Idea
Auto-detect terminal width and truncate the title column to fit, ensuring the table never wraps.

## Changes
- Added `truncate()` function in `src/utils/format.ts`
- Updated `src/utils/table.ts` to calculate available width for title column based on terminal size
- Titles are truncated with "…" when they exceed available space
- Minimum title width of 20 chars, falls back to 80 columns if terminal width unavailable
- Added tests for truncate function
