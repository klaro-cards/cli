# Add helpful hint when board is empty

When `klaro ls` returns no cards, show a helpful hint inviting the user to
create one, with an example command that includes configured dimensions.

## Changes
- Added chalk dependency for colored output
- Updated `src/commands/ls.ts` to show a cyan-colored hint with lightbulb emoji
- Added tests for empty board message with and without dims configured

## Example output
```
No cards found in board kanban.

💡 Hint: klaro create "My first card" status=value priority=value
```
