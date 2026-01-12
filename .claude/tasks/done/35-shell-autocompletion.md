# Shell autocompletion

## Status: DONE

## Problem
Users want tab completion for commands, options, projects, and boards when using the CLI.

## Idea
Implement hybrid autocompletion with static completions for commands/options and cached dynamic completions for projects/boards. Support bash, zsh, and fish shells.

## Changes
- Added `src/lib/completion-cache.ts` - Cache management with 1-hour TTL
- Added `src/completions/commands.ts` - Command/option definitions
- Added `src/completions/bash.ts` - Bash completion script generator
- Added `src/completions/zsh.ts` - Zsh completion script generator
- Added `src/completions/fish.ts` - Fish completion script generator
- Added `src/commands/completion.ts` - Completion command with subcommands
- Updated `src/lib/types.ts` - Added CompletionCache types
- Updated `src/index.ts` - Registered completion command
- Added `tests/completion-cache.test.ts` - Cache tests

## Installation
```bash
# Bash (~/.bashrc)
eval "$(klaro completion bash)"

# Zsh (~/.zshrc)
eval "$(klaro completion zsh)"

# Fish (~/.config/fish/config.fish)
klaro completion fish | source
```

## Available Completions

### Commands
All top-level commands are completed:
```
klaro <TAB>
→ init login logout whoami use config ls create read edit update del fetch sync cheatsheet completion
```

### Subcommands
Commands with subcommands show their options:
```
klaro ls <TAB>      → cards projects boards dimensions
klaro config <TAB>  → set unset list
klaro completion <TAB> → bash zsh fish install refresh
```

### Global Options
Available on any command:
```
klaro --<TAB>
→ --trace --project --dims --board --save-defaults
```

### Command-Specific Options
Each command shows its relevant options:
```
klaro create --<TAB>  → --board --dims --edit
klaro ls cards --<TAB> → --board --limit --dims --filter
klaro fetch --<TAB>   → --board --dims --force
```

### Dynamic Completions (cached)
Projects and boards are fetched from the API and cached for 1 hour:
```
klaro use <TAB>       → (list of project subdomains)
klaro -p <TAB>        → (list of project subdomains)
klaro --project <TAB> → (list of project subdomains)
klaro --board <TAB>   → (list of boards for current project)
klaro -b <TAB>        → (list of boards for current project)
```

### File Completion
The `create` command supports file completion for `@file.md` syntax:
```
klaro create @<TAB>   → (files in current directory)
```

## Cache Management
```bash
# Manually refresh the cache
klaro completion refresh

# Cache is stored in ~/.klaro/completion-cache.json
# TTL: 1 hour
```
