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
klaro write 42 -f card.md         # update a card from a file
klaro describe dimension status   # see a dimension's values
```

Manage attachments:

```bash
klaro attach 42 photo.jpg         # attach a file to a card
klaro ls attachments 42           # list attachments on a card
klaro detach 42 <uuid>            # remove an attachment
klaro detach 42 <uuid> --keep-file  # remove attachment, keep file
```

Configure defaults and target a different Klaro instance:

```bash
klaro config set board backlog                       # set default board
klaro config set api_url http://api.klaro.devel      # use a different instance
klaro config unset api_url                           # reset to https://api.klaro.cards
klaro config list                                    # view current configuration
```

Run `klaro cheatsheet` for more examples, or `klaro <command> --help` for detailed usage.

## Usage

```
Usage: klaro [options] [command]

Command-line interface for Klaro Cards

Options:
  -V, --version                               output the version number
  --trace                                     Enable API request/response tracing
  -p, --project <subdomain>                   Project subdomain
  --dims <dimensions>                         Dimensions to include (comma-separated)
  --board <board>                             Board identifier
  --save-defaults                             Save --dims and --board as project defaults
  -h, --help                                  display help for command

Setup:
  init [folder]                               Initialize Klaro configuration
  login [options]                             Login to Klaro Cards
  logout                                      Logout from Klaro Cards
  whoami                                      Show the currently logged in user
  use <subdomain>                             Set the default Klaro project
  config                                      Manage project configuration and defaults

Cards (and other objects):
  ls                                          List cards, projects, boards, or dimensions
  read [options] <identifiers...>             Read one or more cards and display as markdown
  write [options] <identifier>                Update a card from markdown content (stdin or file)
  create [options] [args...]                  Create a new card in a board
  edit [options] <identifiers...>             Edit one or more cards in your default editor
  update [options] <args...>                  Update one or more cards by identifier
  del [options] <identifiers...>              Delete one or more cards by identifier
  attach [options] <identifier> <files...>    Attach files to a card
  detach [options] <identifier> <attachment>  Remove an attachment from a card
  describe                                    Show detailed information about a dimension or board

Offline:
  fetch [options] <identifiers...>            Download cards as markdown files for offline editing
  sync [options]                              Upload local card changes and delete synced files

Help:
  cheatsheet [options]                        Display a quick reference guide
  help [command]                              display help for command
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
