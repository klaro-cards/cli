# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

- **Authentication commands**
  - `login` - Authenticate with email and password
  - `logout` - End current session
  - `whoami` - Display current user info

- **Project management**
  - `use <project>` - Set default project
  - `ls projects` - List accessible projects
  - `ls boards` - List boards in current project

- **Card management**
  - `ls [cards]` - List cards with filtering and column selection
    - `-b/--board` option for board selection
    - `-l/--limit` option to limit results
    - `--show` option for additional columns
    - `-f/--filter` option for API-level filtering
  - `create <title>` - Create new cards with dimensions
  - `set <identifiers...>` - Update one or more cards
  - `del <identifiers...>` - Delete one or more cards

- **Configuration system**
  - `config set <key> <value>` - Set per-project defaults
  - `config unset <key>` - Remove per-project defaults
  - `config list` - Show current configuration
  - Configurable defaults for `board` and `show` options

- **Developer features**
  - `--trace` global option for API debugging
  - `KLARO_HOME` environment variable for config isolation
  - Comprehensive test suite with unit and acceptance tests

### Technical

- Built with Commander.js for CLI framework
- Uses bmg-js for table formatting
- TypeScript with ES modules
- Vitest for testing
