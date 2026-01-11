# Klaro CLI

Command-line interface for [Klaro Cards](https://klaro.cards).

## Installation

```bash
npm install -g @klarocards/cli
```

Requires Node.js 18.0.0 or higher.

## Quick Start

```bash
# Login to your Klaro account
klaro login

# Select a project to work with
klaro use <project-subdomain>

# List cards
klaro ls

# Create a card
klaro create "My new card"
```

## Commands

### Authentication

#### `klaro login`

Authenticate with your Klaro account. You'll be prompted for your email and password.

```bash
klaro login
```

#### `klaro logout`

End your current session.

```bash
klaro logout
```

#### `klaro whoami`

Display information about the currently logged-in user.

```bash
klaro whoami
```

### Setup

#### `klaro init [folder]`

Initialize Klaro configuration. Creates a `.klaro` directory with config files.

```bash
# Interactive - asks whether to create global or local config
klaro init

# Create local config in current directory
klaro init .

# Create local config in specific directory
klaro init ./my-project

# Set project during init
klaro init . -p myproject
```

### Project Management

#### `klaro use <project>`

Set the default project for subsequent commands.

```bash
klaro use myproject
```

#### `klaro ls projects`

List all projects you have access to.

```bash
klaro ls projects
```

#### `klaro ls boards`

List all boards in the current project.

```bash
klaro ls boards
```

### Card Management

#### `klaro ls [cards]`

List cards in a board. The `cards` subcommand is optional (default behavior).

```bash
# List cards from default board
klaro ls

# List cards from a specific board
klaro ls -b backlog

# Limit results
klaro ls -l 50

# Show additional columns
klaro ls --show progress,assignee

# Filter cards
klaro ls -f assignee=Claude -f progress=todo
```

**Options:**
- `-b, --board <board>` - Board identifier (default: "all")
- `-p, --project <subdomain>` - Project subdomain
- `-l, --limit <number>` - Maximum number of cards to show (default: 20)
- `--show <columns>` - Additional columns to display (comma-separated)
- `-f, --filter <key=value>` - Filter cards (can be used multiple times)

#### `klaro create <title>`

Create a new card.

```bash
# Create a simple card
klaro create "Fix login bug"

# Create a card with dimensions
klaro create "New feature" -d assignee=Claude -d progress=todo

# Create in a specific board
klaro create "Sprint task" -b sprint-1
```

**Options:**
- `-b, --board <board>` - Board identifier (default: "all")
- `-p, --project <subdomain>` - Project subdomain
- `-d, --dimension <key=value>` - Set a dimension value (can be used multiple times)

#### `klaro set <identifiers...>`

Update one or more cards by identifier.

```bash
# Update a single card
klaro set 12 -d assignee=Claude

# Update multiple cards
klaro set 12 89 -d progress=done

# Update with multiple dimensions
klaro set 12 -d assignee=Claude -d progress=in-progress
```

**Options:**
- `-b, --board <board>` - Board identifier (default: "all")
- `-p, --project <subdomain>` - Project subdomain
- `-d, --dimension <key=value>` - Set a dimension value (can be used multiple times)

#### `klaro del <identifiers...>`

Delete one or more cards by identifier.

```bash
# Delete a single card
klaro del 12

# Delete multiple cards
klaro del 12 89 187
```

**Options:**
- `-b, --board <board>` - Board identifier (default: "all")
- `-p, --project <subdomain>` - Project subdomain

### Configuration

#### `klaro config set <key> <value>`

Set a default option value for the current project.

```bash
# Set default board
klaro config set board backlog

# Set default columns to show
klaro config set show progress,assignee
```

#### `klaro config unset <key>`

Remove a default option value.

```bash
klaro config unset board
```

#### `klaro config list`

List all configured defaults for the current project.

```bash
klaro config list
```

**Available config keys:**
- `board` - Default board for ls, create, set, and del commands
- `show` - Default columns to show in ls output

## Global Options

All commands support these global options:

- `--trace` - Enable API request/response tracing for debugging
- `-p, --project <subdomain>` - Override the default project for a single command

## Configuration File

Configuration is stored in a `.klaro` directory with two files:

- `config.json` - Project settings (can be committed to version control)
- `secrets.json` - Authentication token (should NOT be committed)

### Config Directory Resolution

The CLI looks for configuration in this order:

1. `./.klaro/` - Local directory (for project-specific config)
2. `~/.klaro/` - Home directory (global config)

This allows you to commit project-specific settings (like default board) to your repository while keeping your auth token secure in the global config.

### Example: Project-Specific Config

```bash
# Create local config directory
mkdir .klaro

# Add to .gitignore
echo "secrets.json" >> .klaro/.gitignore

# Set project-specific defaults
klaro config set board backlog
klaro config set show progress,assignee
```

The `config.json` can be committed:
```json
{
  "project": "myproject",
  "projectDefaults": {
    "myproject": {
      "board": "backlog",
      "show": "progress,assignee"
    }
  }
}
```

### Environment Variables

- `KLARO_HOME` - Override the home directory for global config lookup

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode (watch)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## License

MIT
