# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`attach` command** - Attach files to cards by uploading to seshat and
  creating a story attachment
  - Supports multiple files in a single command
  - `-d/--description` option for attachment description
  - `--cover` flag to set attachment as card cover image
- **`ls attachments <identifier>`** - List attachments on a card

## [1.1.1] - 2026-03-28

### Fixed

- **`fetch` command** - Slugify now uses only the first line of multiline card
  titles, preventing excessively long filenames

## [1.1.0] - 2026-03-26

### Added

- **`write` command** - Update a card's text from stdin or a file, enabling
  non-interactive card editing for AI agents and scripts
  - `-f/--file` option to read markdown from a file (use `-` for stdin)
  - Supports the same markdown format as `read`/`edit`/`fetch`/`sync`
- **`ls projects` without active project** - No longer requires a project to
  be set before listing available projects

### Changed

- Cheatsheet updated with `write` command examples and tips

## [1.0.0] - 2026-03-25

### Added

- **Authentication commands**
  - `login` - Authenticate with email and password
  - `login --env` - Non-interactive auth via environment variables
  - `logout` - End current session
  - `whoami` - Display current user info

- **Project management**
  - `use <project>` - Set active project by subdomain
  - `ls projects` - List accessible projects
  - `ls boards` - List boards in current project
  - `ls dimensions` - List dimensions in current project

- **Card management**
  - `ls` - List cards with filtering and column selection
    - `-b/--board` option for board selection
    - `-l/--limit` option to limit results
    - `--dims` option for dimension columns
    - `-f/--filter` option for API-level filtering
    - Terminal-aware title truncation
  - `read <identifiers...>` - Display cards as rendered markdown
    - `--raw` option for plain markdown output
    - `--dims` option for YAML frontmatter with dimensions
  - `edit <identifiers...>` - Edit cards in `$EDITOR`
    - Supports editing multiple cards sequentially
    - `--dims` option to include dimensions in editor
  - `create <title>` - Create new cards
    - Support for `@file.md` and stdin input
    - `--edit` flag to open editor after creation
    - Dimension key=value arguments
  - `update <identifiers...> key=value` - Update card dimensions
  - `del <identifiers...>` - Delete cards
  - `describe <dimension>` - Show dimension details and values
  - `describe board <board>` - Show board filters

- **Offline editing**
  - `fetch <identifiers...>` - Download cards as markdown files
  - `sync` - Upload local changes and delete synced files
    - `--keep` option to preserve local files
    - `--dry-run` option to preview changes

- **Configuration**
  - `init` - Initialize config (interactive, local, or in specific folder)
  - `config set/unset/list` - Manage per-project defaults
  - `--save-defaults` global option to save `--dims` and `--board` as defaults
  - Split config into `config.json` (committable) and `secrets.json` (tokens)
  - Local `.klaro/` directory support

- **Help & debugging**
  - `cheatsheet` - Quick reference guide for AI agents
    - `--table` option for human-friendly format
  - `--trace` global option for API request/response debugging
  - Categorized `--help` output
  - Helpful hints on empty boards

### Technical

- Built with Commander.js, TypeScript, ES modules
- Uses bmg-js for table formatting
- Connector interface for pluggable data backends
- Vitest test suite with unit and acceptance tests
