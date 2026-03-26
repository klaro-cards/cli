## Problem to solve

Tables should have nicer borders.

## Idea

- Bump bmg to 1.1.1
- Reintroduce a printTable helper and refactor all places where relations
  are printed to use the printTable helper
- Use Bmg's 1.1.1 support for rounded borders (see CHANGELOG.md on bmg.js repo)

## Implementation

- Bumped @enspirit/bmg-js to 1.1.1 in package.json
- Created `src/utils/table.ts` with `printTable(data, columns)` helper
- Refactored all 5 usages of Bmg.toText() to use printTable:
  - `src/commands/ls.ts` (3 places: cards, projects, boards)
  - `src/commands/create.ts` (1 place)
  - `src/commands/set.ts` (1 place)
- Enabled rounded borders via `{ border: 'rounded' }` option
