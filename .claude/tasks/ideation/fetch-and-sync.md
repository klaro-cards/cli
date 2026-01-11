# Fetch and Sync

Users would like to download cards on their computer, work on them, and
reupload them later.

## Idea

* `klaro fetch <identifiers...>` would download cards in markdown+yamlfrontmatter
  in `.klaro/content/{subdomain}/12-slugified-card-title.md` (respecting the
  current .klaro config folder of course)

* `klaro sync [--keep]` would do the opposite.

