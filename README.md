# Klaro CLI

Command-line interface for [Klaro Cards](https://klaro.cards).

## Installation

```bash
npm install -g @klarocards/cli
```

Requires Node.js 18.0.0 or higher.

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

## License

MIT
