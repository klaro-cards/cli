# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode for development
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npx vitest run tests/config.test.ts  # Run a single test file

# Acceptance tests (requires real API credentials)
KCLI_USER=email KCLI_PASSWORD=pass KCLI_SUBDOMAIN=project npm test -- tests/acceptance.test.ts
```

## Architecture

This is a CLI tool (`klaro`) for interacting with the Klaro Cards API, built with Commander.js.

### Structure

- `src/index.ts` - Entry point, registers all commands with Commander
- `src/commands/` - Command implementations (login, logout, whoami, use, ls, create)
- `src/lib/api.ts` - `KlaroApi` class wrapping the Klaro Cards REST API
- `src/lib/config.ts` - Config file management (`~/.klaro/config.json`)
- `src/lib/types.ts` - TypeScript interfaces for API responses and config
- `src/utils/table.ts` - Table formatting for CLI output

### Key Patterns

- Each command exports a `create*Command()` function returning a Commander `Command`
- Authentication token and project subdomain stored in `~/.klaro/config.json`
- API calls go through `KlaroApi` class which handles auth headers and error handling
- `requireToken()` and `requireProject()` throw descriptive errors when auth/project is missing
- `--trace` flag enables request/response logging for debugging

## Development rules

### Todolist

* Always check .claude/tasks for .md files
* Work on ONGOING tasks by default
* If you're asked to work on a TODO task, move it to ONGOING first
* Track your own subtasks in these .md task files
* You MUST commit those .md task files if you change them as a result of your work

### Code quality

* Don't Repeat Yourself (DRY)
* Use pure functions as much as you can, input -> output, and avoid global state
* ALWAYS write unit tests for those functions
* Key abstractions are in their own file
* Helper functions can be kept together in helper files
