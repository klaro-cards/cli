## Options before command

It should be easier to make an `ls` followed by an `read`.

## Idea

The following works :

```
klaro ls --show assignee,progress
```

But this doesn't :

```
klaro --show assignee,progress ls
```

Could we make it work ? So that it just takes this to have the next step:

```
klaro --show assignee,progress read 1
```

## Implementation

- Added `--show` and `--board` as global options on the main program
- Updated ls, read, and edit commands to use `optsWithGlobals()` to access global options
- Global options are merged with command-specific options (command takes precedence)
- Used long-form `--board` only at global level to avoid conflict with `-b` on subcommands

Now this works:
```bash
klaro --show progress ls
klaro --show progress read 1
klaro --board kanban --show progress ls
```
