# Agent skill to create/enrich Klaro Cards from a job description

A reusable Claude Code agent skill that takes a description of work to be done and uses the `klaro` CLI to create and enrich cards in a target Klaro Cards project (or specific board). The skill should understand the project's structure (boards, dimensions) and create well-formed cards with appropriate attributes based on the job description provided.

## Plan

The skill is a SKILL.md file at `.claude/skills/kc/SKILL.md` that guides Claude to:

1. **Discover the project context** — use `klaro ls boards`, `klaro ls dimensions`, `klaro describe dimension <code>`, `klaro describe board <id>` to understand the project structure before creating cards.
2. **Parse the job description** — understand what cards need to be created or enriched from the user's natural-language description.
3. **Create cards** — use `klaro create` with appropriate title, specification (via `@file` or stdin), and dimension values matching the project's vocabulary.
4. **Enrich existing cards** — use `klaro update` to add/change dimension values, or `klaro edit` to update title/specification.
5. **Verify results** — use `klaro read` and `klaro ls` to confirm changes.

## Todo

- [x] Create the SKILL.md file at `.claude/skills/kc/SKILL.md`
- [x] Test that the skill is recognized (check it appears in available skills)
- [x] Run `npm test` to ensure nothing is broken

## Changes

Created `.claude/skills/kc/SKILL.md` — a user-invocable skill (`/kc`) that guides Claude through a structured workflow for creating and enriching Klaro Cards via the CLI. The skill enforces a discover-first approach (boards, dimensions, vocabulary) before creating or updating cards, and supports both inline and file-based card creation.
