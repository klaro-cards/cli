# 35 - Describe dimension

## Status: DONE

## Summary

Implemented `klaro describe DIMENSION` command to show detailed information about a dimension, including all available values (not truncated like `ls dimensions`).

## Implementation

### Files Created/Modified

1. **Created** `src/commands/describe.ts` - New command implementation
2. **Modified** `src/index.ts` - Registered the command and added to help categories
3. **Created** `tests/commands/describe.test.ts` - Unit tests (8 tests)

### Usage

```bash
klaro describe status
```

### Output Example

```
Dimension: Status
Code: status
Datatype: Nominal

Values:
╭────┬─────────────┬─────────────╮
│ id │ code        │ label       │
├────┼─────────────┼─────────────┤
│  1 │ todo        │ To Do       │
│  2 │ in_progress │ In Progress │
│  3 │ done        │ Done        │
╰────┴─────────────┴─────────────╯

Total: 3 value(s)
```

For dimensions without predefined values:
```
Dimension: Assignee
Code: assignee
Datatype: String

No predefined values (free-form input)
```

### Features

- Shows dimension metadata (name, code, datatype)
- Displays ALL values in a table (id, code, label)
- Handles dimensions with no predefined values
- Error handling for dimension not found
- Supports `-p` global option for custom project
