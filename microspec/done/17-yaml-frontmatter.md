## YAML frontmatter

Users would like to see & edit dimensions with `read` and `edit`.

## Idea

* Introduce those dimension as YAML frontmatter in markdown format for our cards
* -d/--dimension would be used to specify which one

## Implementation

- Added `yaml` package for YAML parsing/stringifying
- Updated `formatStoryMarkdown(story, dimensions?)` to include YAML frontmatter
- Updated `parseStoryMarkdown(markdown)` to parse YAML frontmatter and return dimensions
- Added `-d/--dimension` option to `read` command (can be used multiple times)
- Added `-d/--dimension` option to `edit` command (can be used multiple times)
- Dimensions from frontmatter are included in the API update

Example usage:
```bash
klaro read 12 -d assignee -d progress
klaro edit 12 -d assignee -d progress
```

Output format:
```markdown
---
assignee: Claude
progress: doing
---

# Card title

Description here
```
