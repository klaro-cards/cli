## Read command

Users would like to read a card, including the description.

## Idea

Let's introduce `klaro read <identifier...>`.

The output would be a markdown document like this :

```
# { card toptitle }

{ card summary if any }

{ card description }
```

## Technically

Markdown fields:

* `toptitle` is the first line of the card `title` field as received on API
* `summary` are following lines in `title`, if any
* `description` is the `specification` field

API calls:

* URL: https://{subdomain}.klaro.cards/api/boards/{board}/stories/
* We can get all cards at once by specifying `identifier[]=` in query params
* To get the specification field, we need to specify `Accept: application/vnd+klaro.stories.medium+json`

```
curl -v -H"Authorization: Bearer ..." -H "Accept: application/vnd+klaro.stories.medium+json"  https://klarocli-claude-test.klaro.cards/api/boards/kanban/stories/\?identifier\[\]=20\&identifier\[\]=21
```

## Implementation

- Added `getStories(boardId, identifiers)` method to API with medium format Accept header
- Created `src/commands/read.ts` with:
  - `formatStoryMarkdown(story)` - formats story as markdown
  - `createReadCommand()` - Commander command with -b and -p options
- Supports multiple identifiers, separated by `---` in output
- Added 11 unit tests covering formatting and command behavior
