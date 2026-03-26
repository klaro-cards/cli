# Summary of options

We need to make command options & parameters systematic and crystal clear
for the user.

## Idea

Let's summarize the options and args (principles) we already use and see
whether we can put some order.

## Analysis

### Global Options (defined in index.ts)

| Option | Short | Description |
|--------|-------|-------------|
| `--trace` | - | Enable API request/response tracing |
| `--show <dimensions>` | - | Dimensions to display (comma-separated) |
| `--board <board>` | - | Board identifier |
| `--save-defaults` | - | Save --show and --board as project defaults |

### Commands and Their Options

#### Authentication Commands (no options)

| Command | Arguments | Options |
|---------|-----------|---------|
| `login` | - | - |
| `logout` | - | - |
| `whoami` | - | - |

#### Project/Config Commands

| Command | Arguments | Options |
|---------|-----------|---------|
| `use` | `<subdomain>` | - |
| `init` | `[folder]` | `-p, --project <subdomain>` |
| `config set` | `<key> <value>` | `-p, --project <subdomain>` |
| `config unset` | `<key>` | `-p, --project <subdomain>` |
| `config list` | - | `-p, --project <subdomain>` |
| `cheatsheet` | - | `--table`, `--raw` |

#### Listing Commands (ls subcommands)

| Command | Arguments | Options |
|---------|-----------|---------|
| `ls cards` (default) | - | `-b, --board`, `-p, --project`, `-l, --limit`, `--show`, `-f, --filter` |
| `ls projects` | - | `-p, --project` |
| `ls boards` | - | `-p, --project` |
| `ls dimensions` | - | `-p, --project` |

#### Card Operations

| Command | Arguments | Options |
|---------|-----------|---------|
| `create` | `[title]` | `-b, --board`, `-p, --project`, `-d, --dimension`, `--show`, `-e, --edit` |
| `read` | `<identifiers...>` | `-b, --board`, `-p, --project`, `--show`, `--raw` |
| `edit` | `<identifiers...>` | `-b, --board`, `-p, --project`, `--show` |
| `set` | `<identifiers...>` | `-b, --board`, `-p, --project`, `-d, --dimension` |
| `del` | `<identifiers...>` | `-b, --board`, `-p, --project` |
| `fetch` | `<identifiers...>` | `-b, --board`, `-p, --project`, `--show`, `--force` |
| `sync` | - | `-b, --board`, `-p, --project`, `--keep`, `--dry-run` |

## Common Patterns Identified

### 1. Short Flag Conventions

| Short | Long | Used In |
|-------|------|---------|
| `-b` | `--board` | ls cards, create, read, edit, set, del, fetch, sync |
| `-p` | `--project` | All commands that interact with API |
| `-d` | `--dimension` | create, set |
| `-l` | `--limit` | ls cards only |
| `-f` | `--filter` | ls cards only |
| `-e` | `--edit` | create only |

### 2. Long-only Options

| Option | Description | Used In |
|--------|-------------|---------|
| `--show` | Dimensions to display | global, ls cards, create, read, edit, fetch |
| `--raw` | Output without highlighting | read, cheatsheet |
| `--force` | Overwrite existing | fetch |
| `--keep` | Keep local files | sync |
| `--dry-run` | Preview without changes | sync |
| `--table` | Table format output | cheatsheet |
| `--trace` | Debug API calls | global |
| `--save-defaults` | Persist options | global |

### 3. Argument Patterns

| Pattern | Commands |
|---------|----------|
| `<identifiers...>` (required, multiple) | read, edit, set, del, fetch |
| `[title]` (optional, single) | create |
| `[folder]` (optional, single) | init |
| `<subdomain>` (required, single) | use |
| `<key> <value>` (two required) | config set |
| `<key>` (required, single) | config unset |

### 4. Repeatable Options

| Option | Pattern | Commands |
|--------|---------|----------|
| `-d, --dimension <key=value>` | Collects into array | create, set |
| `-f, --filter <key=value>` | Collects into array | ls cards |

## Inconsistencies Found

### 1. `--show` option descriptions vary

- Global: "Dimensions to display (comma-separated)"
- ls cards: "Additional columns to show (comma-separated)"
- create: "Dimensions to display in output (comma-separated)"
- read/edit: "Include dimensions in YAML frontmatter (comma-separated)"
- fetch: "Include dimensions in YAML frontmatter (comma-separated)"

**Issue**: Different wording, same functionality.

### 2. `--board` description varies

- Most commands: "Board identifier (default: \"all\")"
- Some rely on global option with same description

**Consistency**: This is actually consistent.

### 3. Missing short flags

| Option | Has Short? | Candidates |
|--------|------------|------------|
| `--show` | No | `-s` (but could confuse with "specification") |
| `--raw` | No | `-r` |
| `--force` | No | `-F` or could use `-f` (conflicts with filter) |
| `--keep` | No | `-k` |
| `--dry-run` | No | `-n` (common convention) |
| `--table` | No | `-t` |

### 4. Filter vs Dimension naming

- `--filter` uses `-f` in ls cards (for filtering)
- `--dimension` uses `-d` in create/set (for setting values)

Both use `key=value` syntax but serve different purposes:
- `--filter`: Restricts what cards to show
- `--dimension`: Sets values on cards

**This is actually correct** - they do different things.

### 5. The `--edit` flag on create

- Uses `-e` short form
- Only command with this flag
- Opens $EDITOR immediately after creation

**Observation**: This is fine as a unique feature.

## Recommendations

### 1. Standardize `--show` description

Use: "Dimensions to include (comma-separated)" everywhere.

### 2. Consider adding common short flags

```
--raw      → -r
--force    → -F  (uppercase to avoid conflict with -f/--filter)
--keep     → -k
--dry-run  → -n
```

### 3. Keep `-d` for dimension (not add to --show)

The `-s` flag for show could be confused with "specification".
Using `--show` as long-only is clearer.

### 4. Document the option hierarchy

Global options can be overridden by command options:
- `klaro --board all ls` vs `klaro ls -b backlog`
- Command options take precedence

## Summary Table: Recommended Standard

| Category | Option | Short | Description |
|----------|--------|-------|-------------|
| **Context** | `--project` | `-p` | Project subdomain |
| **Context** | `--board` | `-b` | Board identifier |
| **Display** | `--show` | - | Dimensions to include (comma-separated) |
| **Display** | `--raw` | `-r` | Output without highlighting |
| **Display** | `--table` | `-t` | Table format output |
| **Data** | `--dimension` | `-d` | Set dimension value (repeatable) |
| **Data** | `--filter` | `-f` | Filter by dimension (repeatable) |
| **Data** | `--limit` | `-l` | Maximum items to show |
| **Safety** | `--force` | `-F` | Overwrite without asking |
| **Safety** | `--keep` | `-k` | Preserve local files |
| **Safety** | `--dry-run` | `-n` | Preview without changes |
| **Action** | `--edit` | `-e` | Open in editor |
| **Debug** | `--trace` | - | Enable API tracing |
| **Config** | `--save-defaults` | - | Save current options as defaults |

## Revised Plan (Approved)

### Changes to Implement

1. **Make `--project` global**
   - Remove `-p, --project` from all individual commands
   - Add `--project` to global options in index.ts (like `--board`)

2. **Rename `--show` to `--dims`**
   - More descriptive name
   - Update everywhere: global, ls cards, create, read, edit, fetch
   - Update `resolveShow` → `resolveDims` in defaults.ts

3. **Keep `config set/unset` with positional args** (flags would conflict with global `--board`)
   ```bash
   # Syntax (unchanged, but now accepts 'dims' instead of 'show')
   klaro config set board backlog
   klaro config set dims progress,assignee
   klaro config unset board
   klaro config unset dims
   ```

4. **Replace `-d, --dimension` with positional `key=value` args**
   ```bash
   # Before
   klaro create "Title" -d status=open -d assignee=Bob
   klaro set 1 2 3 -d status=done

   # After
   klaro create "Title" status=open assignee=Bob
   klaro set 1 2 3 status=done
   ```
   - Args containing `=` are dimensions
   - Args without `=` are identifiers (set) or title (create)

### Implementation Order

1. [x] Make `--project` global
2. [x] Rename `--show` to `--dims`
3. [x] Update `config set/unset` to accept 'dims' key (kept positional args to avoid conflict with global --board)
4. [x] Replace `-d` with positional args
5. [x] Update cheatsheet examples
6. [x] Run tests and fix

## Status

- [x] Analyze all commands
- [x] Document patterns and inconsistencies
- [x] Propose systematic naming conventions
- [x] Get approval on revised plan
- [x] Implement changes
