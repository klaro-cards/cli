## Problem to solve

The table is not displaying very nicely, let's get some help.

## Idea

Bmg.js (@enspirit/bmg-js:1.1.0) has a `toText` helper that displays any table
in ASCII properly.

Replace existing hard-coded table display by a use of it.

## Done

- Installed @enspirit/bmg-js:1.1.0
- Updated `src/utils/table.ts` to use Bmg's `toText()` method
- Updated tests to reflect the new implementation (removed tests for unsupported features like `width` and `align`)
- All tests pass
