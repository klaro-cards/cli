# 36 - Describe boards

## Status: DONE

## Summary

Extended the `describe` command to support boards with subcommands.

## Implementation

### Command Structure

- `klaro describe board <id>` - describe a board (shows filters)
- `klaro describe dimension <code>` - describe a dimension
- `klaro describe <code>` - shortcut for `klaro describe dimension <code>` (default)

### Files Modified

1. `src/commands/describe.ts` - Refactored to use subcommands, added board support
2. `src/lib/api.ts` - Added `getBoard(boardId)` method
3. `src/lib/types.ts` - Added `BoardFilter` interface, updated `Board` interface
4. `tests/commands/describe.test.ts` - Added tests for subcommands and board describe

### Example Output

```
$ klaro describe board sprint-1

Board: Sprint 1
Location: sprint-1

Filters:
╭───────────┬─────────────╮
│ dimension │ value       │
├───────────┼─────────────┤
│ status    │ in_progress │
│ assignee  │ Alice       │
╰───────────┴─────────────╯
```
