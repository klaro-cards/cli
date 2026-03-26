# Klaro CLI

Command-line interface for [Klaro Cards](https://klaro.cards).

## Installation

```bash
npm install -g @klarocards/cli
```

Requires Node.js 18.0.0 or higher.

## Getting Started

Login with your Klaro Cards credentials:

```bash
klaro login [--env]
```

Select the project you want to work with:

```bash
klaro ls projects          # see available projects
klaro use my-project       # set the active project
```

Explore the project structure:

```bash
klaro ls boards            # list boards in the project
klaro ls dimensions        # list available dimensions
klaro describe board backlog       # see a board's filters
klaro describe dimension status    # see a dimension's values
```

Start working with cards:

```bash
klaro ls                          # list cards (default board)
klaro ls -b backlog               # list cards from a specific board
klaro ls --dims status,assignee   # show specific dimensions
klaro read 42                     # read a card's full content
klaro create "My new card"        # create a card
klaro update 42 status=done       # update a card's dimension
klaro edit 42                     # edit a card in your $EDITOR
```

Run `klaro cheatsheet` for more examples, or `klaro <command> --help` for detailed usage.

## Usage

```
Usage: klaro [options] [command]

Command-line interface for Klaro Cards

Options:
  -V, --version                     output the version number
  --trace                           Enable API request/response tracing
  --show <dimensions>               Dimensions to display (comma-separated)
  --board <board>                   Board identifier
  --save-defaults                   Save --show and --board as project defaults
  -h, --help                        display help for command

Commands:
  login                             Login to Klaro Cards
  logout                            Logout from Klaro Cards
  whoami                            Show the currently logged in user
  use <subdomain>                   Set the default Klaro project
  ls                                List cards, projects, boards, or dimensions
  create [options] [title]          Create a new card in a board
  del [options] <identifiers...>    Delete one or more cards by identifier
  set [options] <identifiers...>    Update one or more cards by identifier
  read [options] <identifiers...>   Read one or more cards and display as markdown
  edit [options] <identifiers...>   Edit one or more cards in your default editor
  config                            Manage project configuration and defaults
  init [options] [folder]           Initialize Klaro configuration
  cheatsheet [options]              Display a quick reference guide
  fetch [options] <identifiers...>  Download cards as markdown files for offline editing
  sync [options]                    Upload local card changes and delete synced files
  help [command]                    display help for command
```

Run `klaro cheatsheet` for common usage examples.

## Development

```bash
npm install     # Install dependencies
npm run build   # Build
npm test        # Run tests
```

### Running from source

Build and run directly:

```bash
npm run build
node dist/index.js
```

Or use watch mode for development (auto-recompiles on changes):

```bash
npm run dev
```

Then in another terminal:

```bash
node dist/index.js
```

To make the `klaro` command available globally from your local checkout:

```bash
npm link
klaro
```

## License

MIT
