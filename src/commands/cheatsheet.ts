import { Command } from 'commander';

const CHEATSHEET = `# Klaro CLI

Klaro CLI is a command-line interface for managing cards on Klaro Cards.
It is designed to be AI-agent friendly, enabling seamless integration with
tools like Claude Code for backlog, task and project management workflows.

## Setup

klaro init .                     # Initialize klaro in current directory
klaro login                      # Authenticate with email/password
klaro use <project>              # Set active project by subdomain

## Listing cards

klaro ls                         # List cards (default board: all)
klaro ls -b backlog              # List from specific board
klaro ls --show progress         # Show specific dimensions
klaro ls --filter status=open    # Filter by dimension value

## Reading cards

klaro read 1                     # Read card as markdown
klaro read 1 2 3                 # Read multiple cards
klaro read 1 --show progress     # Include dimensions in output

## Editing cards

klaro edit 1                     # Edit card in $EDITOR
klaro edit 1 2 3                 # Edit multiple cards sequentially
klaro edit 1 --show progress     # Include dimensions in editor

## Creating cards

klaro create "Card title"        # Create new card
klaro create "Title" -b backlog  # Create in specific board

## Updating cards

klaro set 1 progress=done        # Update a dimension
klaro set 1 2 3 progress=done    # Update multiple cards
klaro del 1                      # Delete a card

## Saving defaults

Many commands use --show, --board. You can set default values for them.

klaro config set board backlog              # Set a default --board option
klaro config set show progress,assignee     # Set default --show option
klaro --save-defaults ls --show progress    # Save defaults as you go
klaro config list                           # View saved defaults

## Tips

- Use \`--raw\` with \`read\` to get plain markdown without highlighting
- Cards are identified by their numeric identifier (shown in ls output)
- Most commands support \`-p <project>\` to override the active project

Run \`klaro --help\` for all available commands and options.
Run \`klaro <command> --help\` for detailed help on a specific command.
`;

export function createCheatsheetCommand(): Command {
  return new Command('cheatsheet')
    .description('Display a quick reference guide for AI agents')
    .action(() => {
      console.log(CHEATSHEET);
    });
}
