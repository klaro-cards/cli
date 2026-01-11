# Fetch and Sync

Users would like to download cards on their computer, work on them, and
reupload them later.

## Idea

* `klaro fetch <identifiers...>` would download cards in markdown+yamlfrontmatter
  in `.klaro/content/{subdomain}/12-slugified-card-title.md` (respecting the
  current .klaro config folder of course)

* `klaro sync [--keep]` would do the opposite.

Don't forget to document those commands in --help and cheatsheet.

## Implementation

- Created `src/utils/content.ts` with content directory utilities
- Created `src/commands/fetch.ts`:
  - Downloads cards to `.klaro/content/{project}/{id}-{slug}.md`
  - Options: `-b/--board`, `-p/--project`, `--show`, `--force`
  - Skips existing files unless `--force` is used
- Created `src/commands/sync.ts`:
  - Uploads all `.md` files from content directory
  - Deletes files after sync by default
  - Options: `-b/--board`, `-p/--project`, `--keep`, `--dry-run`
- Added "Offline" section to cheatsheet with fetch/sync examples
- Full test coverage for both commands
