# Add a Getting Started section to the README

The README currently jumps straight into a dry `Usage` block with the full help output.
New users (and AI agents) need a guided walkthrough: login, pick a project, explore
boards & dimensions, then start working with cards.

## Plan

Add a `## Getting Started` section between `## Installation` and `## Usage` that walks
through a realistic scenario:

1. Login to Klaro
2. Select a project with `use`
3. Explore boards and dimensions with `ls boards`, `ls dimensions`, `describe`
4. List cards, read one, create one, update one

Keep it concise — shell snippets with brief commentary, not a tutorial essay.

## Todo

- [x] Write the Getting Started section in README.md
- [x] Review for accuracy against actual CLI commands
- [x] Run tests to make sure nothing is broken

## Changes

Added a Getting Started section to README.md between Installation and Usage.
Covers the full onboarding flow: login, project selection, exploring boards &
dimensions, and working with cards (list, read, create, update, edit).
Fixed flag name to use `--dims` (matching actual code) instead of stale `--show`.
