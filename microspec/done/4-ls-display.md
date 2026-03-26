## Problem to solve

`klaro ls` shows all card dimensions, the table is too large.

## Idea

* Cards (aka stories) received by the API can be seed a Bmg Relation
* Relation#project([...]) could help showing certain dimensions only
* By default we could show `identifier` and `title`
* The user could specify additional dimensions to show with `-d progress,assignee`

## Solution implemented

Modified `src/commands/ls.ts`:
- Added `-d, --dimensions <dims>` option for comma-separated dimension names
- Used `Bmg(stories).project(columns).toText()` to display only selected columns
- Default columns are `['identifier', 'title']`

Fixed `src/lib/types.ts`:
- Story interface now uses index signature for flat dimensions (no nested object)

Added tests for `-d` option and default column behavior.

## Status: Complete
