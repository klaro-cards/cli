---
name: release
description: Prepare a minor or patch release — update docs, bump version, tag. Use when asked to release, e.g. "/release patch" or "/release minor".
argument-hint: "<patch|minor> [version-override]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Release Skill

Prepare a release of the Klaro CLI. The user specifies `patch` or `minor` (or an explicit version like `1.5.0`).

## Steps

### 1. Determine the new version

- Read the current version from `package.json`.
- If the user gave an explicit version, use it. Otherwise bump according to semver:
  - `patch`: increment the patch number (e.g. 1.4.1 -> 1.4.2)
  - `minor`: increment the minor number, reset patch (e.g. 1.4.1 -> 1.5.0)

### 2. Identify unreleased changes

- Run `git log --oneline` from the last version tag to HEAD.
- For each commit, understand what changed (read the diff if the message is unclear).
- Categorize changes as Added, Changed, or Fixed.

### 3. Update documentation

Check and update **all four** of these:

1. **CHANGELOG.md** — Move content from `[Unreleased]` into a new `[X.Y.Z] - YYYY-MM-DD` section. Use today's date. Follow the Keep a Changelog format with ### Added / ### Changed / ### Fixed subsections as needed.
2. **README.md** — Update any Getting Started examples, command descriptions, or help output that are affected by the changes.
3. **Cheatsheet** (`src/commands/cheatsheet.ts`) — Add examples for new commands or options. Update existing examples if behavior changed.
4. **`--help` descriptions** — Check that `.description()` text on any changed commands is accurate.

### 4. Bump version numbers

Update the version string in exactly two places:
- `package.json` — the `"version"` field
- `src/index.ts` — the `.version('X.Y.Z')` call

### 5. Build and test

```bash
npm run build
npm test
```

Both must pass before proceeding.

### 6. Commit and tag

- Stage all changed files and commit with message: `Bump version to X.Y.Z`
- Create a git tag: `vX.Y.Z`

### 7. Stop — do NOT push

Tell the user:
- The release commit and tag are ready locally
- They should review with `git log --oneline -5` and `git diff HEAD~1`
- When satisfied: `git push && git push --tags`
