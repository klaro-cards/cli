# Add microspec workflow as a Claude Code skill

Convert the MICROSPEC.md workflow document into a `/microspec` Claude Code skill
so the agent follows the card-based workflow natively.

## Plan

- Create `.claude/skills/microspec/SKILL.md` encoding all workflow rules
- Use subfolders (ideation, todo, ongoing, analyzed, hold-on, done) as the source
  of truth for card status instead of YAML frontmatter
- Add `.gitkeep` files so empty folders are tracked by git
- Remove the standalone `MICROSPEC.md` (superseded by the skill)

## Todo

- [x] Create `.claude/skills/microspec/SKILL.md` with full workflow
- [x] Create all six subfolders with `.gitkeep`
- [x] Remove `MICROSPEC.md` from repo root

## Changes

- Added `.claude/skills/microspec/SKILL.md` — encodes the full micro spec
  workflow as a Claude Code skill invocable via `/microspec`
- Added `microspec/{ideation,todo,ongoing,analyzed,hold-on,done}/.gitkeep`
- Removed `MICROSPEC.md` (superseded by the skill)
