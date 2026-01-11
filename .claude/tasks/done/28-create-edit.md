# Create and immediately edit

I'd like to create a card and have the editor immediately opening it in edit mode.

## Idea

`klaro create --edit` would first create the card, then initiate the normal `edit`
flow on it.

## Implementation

- Added `-e, --edit` flag to the `create` command
- Extracted shared edit logic into `src/utils/story-editor.ts` (`editStoryInEditor`)
- Both `create --edit` and `edit` commands now use the same utility
- After creating a card with `--edit`, the editor opens immediately
- If changes are made, the card is updated via API
- Messages: "Card X created and updated." or "Card X created (no edits made)."
