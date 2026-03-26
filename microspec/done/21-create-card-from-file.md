## Create card from file or stdin

Users would like to create cards from existing .md files, or pipe an agent
output as a card.

## Idea

Add support for those:

* `klaro create [-d/--dimension] @path/to/file.md`
* `klaro create [-d/--dimension] --from-file path/to/file.md`
* `something | klaro create [-d/--dimension]`

Make that clear in --help and cheatsheet.

## Implementation

- Added `@file.md` syntax to read card content from a markdown file
- Added stdin support when no title argument provided
- Uses existing `parseStoryMarkdown` to extract title, specification, and dimensions
- CLI dimensions (-d) override file dimensions
- Updated cheatsheet with new syntax examples
