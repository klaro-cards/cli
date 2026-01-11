## Take --show into account on create/read/edit

When creating a card, default --show should be taken into account when
displaying the created card.

Same for `read` and `edit` commands (yaml frontmatter). Maybe that's already the
case, check it.

## Implementation

- `read` and `edit` already used `resolveShow` (done previously)
- Added `resolveShow` to `create` command for output columns
- Added `--show` option to `create` command
- Now uses `optsWithGlobals()` to respect global --show/--board options
