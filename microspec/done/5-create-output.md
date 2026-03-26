## Problem to solve

When creating a card, we should simply show a table (like `ls` does) but
with the card created.

## Idea

The API returns the created card as a json object. Putting it in an array
allows having a Relation easily, which can be printed similarly to ls.

## Done

- Updated `src/commands/create.ts` to use Bmg for table output
- Display shows identifier, title, and any dimensions used
- Updated unit tests and acceptance tests to expect table format
