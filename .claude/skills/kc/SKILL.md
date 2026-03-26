---
name: kc
description: Create or enrich Klaro Cards in a project using the klaro CLI. Use when asked to populate a board, create cards from a job description, enrich existing cards with dimension values, or bulk-manage cards in Klaro Cards.
argument-hint: "[job description or card identifiers]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Klaro Cards Agent Skill

You use the `klaro` CLI to create and/or enrich cards in a Klaro Cards project based on a job description provided by the user.

## Prerequisites

Before doing anything, verify that `klaro` is available and the user is logged in:

```bash
npx klaro whoami
```

If this fails, try logging in automatically using environment variables:

```bash
npx klaro login --env
```

This requires `KLARO_LOGIN` and `KLARO_PASSWORD` to be set in the environment. If they are not set or login fails, stop and ask the user to either:
- Set `KLARO_LOGIN` and `KLARO_PASSWORD` environment variables, or
- Run `klaro login` interactively themselves

## Step 1 — Determine the target

Parse `$ARGUMENTS` to understand:
- **What** cards to create or enrich (the job description)
- **Where** to put them (project and/or board, if specified)

If no project is specified, rely on the current default (`klaro use`). If no board is specified, use "all" or ask the user.

## Step 2 — Discover the project structure

Run these commands to understand the project's vocabulary:

```bash
npx klaro ls boards
npx klaro ls dimensions
```

For each dimension that has predefined values and seems relevant to the job, run:

```bash
npx klaro describe dimension <code>
```

Also describe the target board if one was specified:

```bash
npx klaro describe board <board-id>
```

**Important:** Study the dimension values carefully. When creating or enriching cards, you MUST use values that match the project's vocabulary exactly (case-sensitive). For dimensions with predefined values, only use those values. For free-form dimensions, use sensible values consistent with existing cards.

## Step 3 — Understand existing cards (if enriching)

If the job involves enriching existing cards, list them first:

```bash
npx klaro ls -b <board> --dims <relevant-dims>
```

To read a card's full content:

```bash
npx klaro read <identifier> --dims <relevant-dims>
```

## Step 4 — Create cards

For each card to create, prepare a markdown file with YAML frontmatter for dimensions:

```markdown
---
dimension1: value1
dimension2: value2
---

# Card Title

Optional summary paragraph.

Detailed specification or description here.
```

Then create the card:

```bash
npx klaro create @/tmp/klaro-card-<n>.md -b <board> --dims <dims-to-show>
```

You can also create simple cards inline:

```bash
npx klaro create "Card title" dimension1=value1 dimension2=value2 -b <board>
```

**Guidelines for card content:**
- Titles should be concise (one sentence) and action-oriented when describing work
- Specifications should be end-user oriented, describing the problem or desired outcome
- Use the project's dimension vocabulary — never invent dimension values for dimensions that have predefined options

## Step 5 — Enrich existing cards

To update dimension values on existing cards:

```bash
npx klaro update <identifier> dimension1=value1 dimension2=value2 -b <board>
```

To update multiple cards with the same values:

```bash
npx klaro update <id1> <id2> <id3> dimension1=value1 -b <board>
```

To edit a card's title or specification, write the updated content to a temp file and use:

```bash
npx klaro read <identifier> --dims <dims> --raw > /tmp/klaro-edit-<id>.md
# ... edit the file ...
cat /tmp/klaro-edit-<id>.md | npx klaro create -b <board>
```

Or for interactive editing when `$EDITOR` is available:

```bash
npx klaro edit <identifier> --dims <dims> -b <board>
```

## Step 6 — Verify results

After creating or enriching cards, verify the results:

```bash
npx klaro ls -b <board> --dims <relevant-dims> -l 50
```

Report back to the user what was created or changed, including card identifiers.

## Rules

- **Always discover before acting.** Never create cards without first understanding the project's boards and dimensions.
- **Respect the vocabulary.** Use exact dimension values from the project. Do not guess or invent values.
- **Clean up temp files.** Remove any `/tmp/klaro-card-*.md` or `/tmp/klaro-edit-*.md` files when done.
- **Be incremental.** For large batches, create a few cards first, verify with the user, then continue.
- **Report what you did.** After each batch of changes, show the user a summary with card identifiers and titles.
