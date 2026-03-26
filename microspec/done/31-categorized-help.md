# Categorized Help Output

## Idea

Improve the `--help` output by organizing commands into logical categories,
similar to how the cheatsheet groups examples. This makes it easier for users
to find related commands and understand the CLI structure at a glance.

## Summary of Changes

### Custom Help Formatter

Created a `CategorizedHelp` class extending Commander's `Help` class that
overrides `formatHelp()` to group commands by category instead of showing
them in a flat list.

### Command Categories

Commands are organized into four categories:

- **Setup**: init, login, logout, whoami, use, config
- **Cards (and other objects)**: ls, read, create, edit, update, del
- **Offline**: fetch, sync
- **Help**: cheatsheet, help

### Implementation Details

1. Added `COMMAND_CATEGORIES` constant mapping category names to command names
2. Created `CategorizedHelp` class with custom `formatHelp()` method
3. Created `KlaroCommand` class extending `Command` to use custom help
4. Any commands not in a category appear under "Other"

### Result

Before:
```
Commands:
  login                             Login to Klaro Cards
  logout                            Logout from Klaro Cards
  whoami                            Show the currently logged in user
  use <subdomain>                   Set the default Klaro project
  ls                                List cards, projects, boards, or dimensions
  ...
```

After:
```
Setup:
  init [folder]                     Initialize Klaro configuration
  login                             Login to Klaro Cards
  ...

Cards (and other objects):
  ls                                List cards, projects, boards, or dimensions
  read [options] <identifiers...>   Read one or more cards as markdown
  ...

Offline:
  fetch [options] <identifiers...>  Download cards as markdown files
  sync [options]                    Upload local card changes

Help:
  cheatsheet [options]              Display a quick reference guide
  help [command]                    display help for command
```

## Status

- [x] DONE
