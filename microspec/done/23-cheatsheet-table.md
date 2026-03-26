# Cheatsheet table

Humans need a clearer cheatsheet format.

## Idea

Let's try a --human (or --table) option to cheatsheet, so that it gives
examples per section in a table.

## Technically

* Let's build a Bmg Relation with category, example, explanation
* We would group example, explanation as examples

Intro and Hints would remain the same (not in the table)

## Implementation

- Restructured cheatsheet to use structured EXAMPLES array
- Added `--table` option for human-friendly table format using Bmg
- Default output remains markdown (for AI agents)
- Intro and Tips remain as text in both formats
- Uses `.group(['example', 'explanation'], { allbut: true, as: 'examples' })` to group by category
