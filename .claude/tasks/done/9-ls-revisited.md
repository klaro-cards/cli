## Problem to solve

We made a mistake in 155adfabfbaaaded59bcc75eb9047b0f7d9d97c0, -f should
filter cards, not show table columns.

## Idea

- Revert the commit (`f` -> `-d` again)
- `-d/--dimensions` becomes `--show assignee,progress` (no `-s`)
- `--show` can be set as a default with `klaro config set show assignee,progress`
- `-f/--filters` effectively becomes filtering cards (passed to the API as query params)

