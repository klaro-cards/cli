---
name: microspec
description: Work on a micro spec card — start, plan, implement, and finish development tasks tracked as markdown cards in microspec/
argument-hint: "[card-file-or-title]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# Micro spec workflow

You follow a micro spec approach where each development task is a short markdown card in the `microspec/` folder. The card's **subfolder** determines its status — there is no status field in the file itself.

## Folder structure

```
microspec/
  ideation/    # Raw ideas, not yet scoped
  todo/        # Scoped and ready to work on
  ongoing/     # Currently being worked on
  analyzed/    # Plan written, waiting for human decision
  hold-on/     # Paused / blocked
  done/        # Completed (numbered files)
```

A card's status is **always** determined by which subfolder it lives in. To change status, **move the file** to the target subfolder.

## Step 1 — Find or create a card

- If `$ARGUMENTS` names an existing card file, read it and note which subfolder it is in.
- If `$ARGUMENTS` is a title or description for new work, create a new card in `microspec/todo/`.
- If `$ARGUMENTS` is empty, scan `microspec/ongoing/` for a card and resume it. If none, scan `microspec/todo/` and list available cards.

## Step 2 — Determine the card's current status and act

The card's subfolder tells you its status.

### Card is in `ideation/`

This is a raw idea. Read it, scope it, flesh out the description, and move it to `todo/` when it's ready.

### Card is in `todo/`

1. Read the card fully.
2. Move it to `ongoing/`.
3. Analyze the work: explore the codebase, understand what needs to change.
4. Write a `## Plan` section with your analysis and a `## Todo` checklist inside the card.
5. If the plan needs a human decision, move the card to `analyzed/` and stop — ask the user.
6. Otherwise, proceed to implementation.

### Card is in `ongoing/`

1. Read the card and its plan/todo list.
2. Continue implementing from where you left off.

### Card is in `analyzed/`

1. The user has reviewed your plan. Read their feedback (if any) and proceed to implementation.
2. Move the card back to `ongoing/`.

### Card is in `hold-on/`

Do not work on it unless the user explicitly asks. Mention it is on hold.

## Step 3 — Implement

- Work through the `## Todo` checklist item by item.
- Check off each item as you complete it and update the card file.
- Follow all project coding standards from CLAUDE.md.
- Write unit tests for new functions.

## Step 4 — Commit at milestones

Every time you reach a milestone (a meaningful chunk of work):
1. Run `npm test` — tests **must** pass.
2. Stage all relevant changes **including the card file**.
3. Commit. The card file MUST be included in every commit.

## Step 5 — Finish

When all todo items are done:
1. Add a `## Changes` section to the card summarizing what was done.
2. If the card has no number, assign the next available number (check `microspec/done/`).
3. Move the card file to `microspec/done/` (rename with number prefix, e.g. `38-my-feature.md`).
4. Run tests one final time and commit everything.
5. Check whether the commit history can be simplified and rebase/squash accordingly.

## Card file format

Cards have no YAML frontmatter — status is determined by the subfolder. The file is pure markdown:

```markdown
# Card title (one sentence)

Summary paragraph — end-user oriented, describes the problem to solve.

## Plan

Analysis and approach (added when moving to ongoing/).

## Todo

- [ ] Task items (checkbox list)

## Changes

Summary of what was done (added when moving to done/).
```

## State transitions

Only these transitions are allowed (implemented by moving the file between subfolders):

```
ideation/ -> todo/          # idea scoped and ready
todo/     -> ongoing/       # start working
ongoing/  -> analyzed/      # plan written, needs human decision
analyzed/ -> ongoing/       # human approved, resume work
ongoing/  -> done/          # work finished
ongoing/  -> hold-on/       # paused / blocked
hold-on/  -> ongoing/       # unblocked, resume
```

## Rules

- ALWAYS work one card at a time.
- ALWAYS finish the ongoing card before starting another.
- A card MUST exist and be included in every commit.
- Never commit without running tests first.
- Status lives in the folder, not in the file. Move files, don't edit status fields.
