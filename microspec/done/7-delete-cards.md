## Status: DONE

## Problem to solve

I'd like to delete card(s) easily

## Idea

Delete a single card, by identifier :

```
bin/klaro [-b/--board] del 12
```

Delete multiple cards by identifiers :

```
bin/klaro [-b/--board] del 12 89 187
```

Delete multiple cards by filters (not sure Klaro's API will allow it) :

```
bin/klaro [-b/--board] --filter assignee=Claude del
```

## Implementation

- Added `deleteStories(boardId, identifiers)` method to KlaroApi
- Created `del` command accepting one or more identifiers
- Uses DELETE /boards/{board}/stories with JSON body `[{ identifier }]`
- Supports `-b/--board` option with project default
- Filter-based deletion deferred (API support uncertain)
