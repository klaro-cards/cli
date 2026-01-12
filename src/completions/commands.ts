// Command and option definitions for shell completion generators

export interface CommandDef {
  name: string;
  description: string;
  subcommands?: CommandDef[];
  options?: OptionDef[];
  takesArgs?: 'projects' | 'boards' | 'identifiers' | 'files' | 'none';
}

export interface OptionDef {
  short?: string;
  long: string;
  description: string;
  takesArg?: 'projects' | 'boards' | 'files' | 'string' | 'none';
}

// Global options available on all commands
export const GLOBAL_OPTIONS: OptionDef[] = [
  { long: '--trace', description: 'Enable API request logging' },
  { short: '-p', long: '--project', description: 'Project subdomain', takesArg: 'projects' },
  { long: '--dims', description: 'Dimensions to display', takesArg: 'string' },
  { long: '--board', description: 'Board identifier', takesArg: 'boards' },
  { long: '--save-defaults', description: 'Save dims and board as defaults' },
];

// All CLI commands
export const COMMANDS: CommandDef[] = [
  // Setup commands
  {
    name: 'init',
    description: 'Initialize a local .klaro folder',
    options: [],
    takesArgs: 'none',
  },
  {
    name: 'login',
    description: 'Authenticate with Klaro Cards',
    options: [],
    takesArgs: 'none',
  },
  {
    name: 'logout',
    description: 'Clear stored credentials',
    options: [],
    takesArgs: 'none',
  },
  {
    name: 'whoami',
    description: 'Show current user info',
    options: [],
    takesArgs: 'none',
  },
  {
    name: 'use',
    description: 'Set the active project',
    options: [],
    takesArgs: 'projects',
  },
  {
    name: 'config',
    description: 'Manage project configuration',
    subcommands: [
      { name: 'set', description: 'Set a default option', takesArgs: 'none' },
      { name: 'unset', description: 'Remove a default option', takesArgs: 'none' },
      { name: 'list', description: 'List all defaults', takesArgs: 'none' },
    ],
  },
  // Card commands
  {
    name: 'ls',
    description: 'List cards, projects, boards, or dimensions',
    subcommands: [
      {
        name: 'cards',
        description: 'List cards in a board',
        options: [
          { short: '-b', long: '--board', description: 'Board identifier', takesArg: 'boards' },
          { short: '-l', long: '--limit', description: 'Max cards to show', takesArg: 'string' },
          { long: '--dims', description: 'Dimensions to include', takesArg: 'string' },
          { short: '-f', long: '--filter', description: 'Filter cards', takesArg: 'string' },
        ],
      },
      { name: 'projects', description: 'List projects' },
      { name: 'boards', description: 'List boards' },
      { name: 'dimensions', description: 'List dimensions' },
    ],
  },
  {
    name: 'create',
    description: 'Create a new card',
    options: [
      { short: '-b', long: '--board', description: 'Board identifier', takesArg: 'boards' },
      { long: '--dims', description: 'Dimensions to include', takesArg: 'string' },
      { short: '-e', long: '--edit', description: 'Open in editor after creation' },
    ],
    takesArgs: 'files',
  },
  {
    name: 'read',
    description: 'Display card details',
    options: [
      { short: '-b', long: '--board', description: 'Board identifier', takesArg: 'boards' },
      { long: '--dims', description: 'Dimensions to include', takesArg: 'string' },
      { long: '--raw', description: 'Output raw markdown' },
    ],
    takesArgs: 'identifiers',
  },
  {
    name: 'edit',
    description: 'Edit cards in your editor',
    options: [
      { short: '-b', long: '--board', description: 'Board identifier', takesArg: 'boards' },
      { long: '--dims', description: 'Dimensions to include', takesArg: 'string' },
    ],
    takesArgs: 'identifiers',
  },
  {
    name: 'update',
    description: 'Update card dimensions',
    options: [
      { short: '-b', long: '--board', description: 'Board identifier', takesArg: 'boards' },
    ],
    takesArgs: 'identifiers',
  },
  {
    name: 'del',
    description: 'Delete cards',
    options: [
      { short: '-b', long: '--board', description: 'Board identifier', takesArg: 'boards' },
    ],
    takesArgs: 'identifiers',
  },
  // Offline commands
  {
    name: 'fetch',
    description: 'Download cards to local files',
    options: [
      { short: '-b', long: '--board', description: 'Board identifier', takesArg: 'boards' },
      { long: '--dims', description: 'Dimensions to include', takesArg: 'string' },
      { long: '--force', description: 'Overwrite existing files' },
    ],
    takesArgs: 'identifiers',
  },
  {
    name: 'sync',
    description: 'Sync local files with remote',
    options: [
      { short: '-b', long: '--board', description: 'Board identifier', takesArg: 'boards' },
      { long: '--keep', description: 'Keep local files after sync' },
      { long: '--dry-run', description: 'Preview changes without executing' },
    ],
    takesArgs: 'none',
  },
  // Help commands
  {
    name: 'cheatsheet',
    description: 'Show command reference',
    options: [
      { long: '--table', description: 'Display in table format' },
      { long: '--raw', description: 'Output without highlighting' },
    ],
    takesArgs: 'none',
  },
  {
    name: 'completion',
    description: 'Generate shell completion scripts',
    subcommands: [
      { name: 'bash', description: 'Generate bash completions' },
      { name: 'zsh', description: 'Generate zsh completions' },
      { name: 'fish', description: 'Generate fish completions' },
      { name: 'install', description: 'Install completions to shell config' },
      { name: 'refresh', description: 'Refresh completion cache' },
    ],
    options: [
      { long: '--list-projects', description: 'List cached projects (internal)' },
      { long: '--list-boards', description: 'List cached boards (internal)' },
    ],
  },
];

// Get all command names (top-level)
export function getCommandNames(): string[] {
  return COMMANDS.map(c => c.name);
}

// Get subcommand names for a command
export function getSubcommandNames(command: string): string[] {
  const cmd = COMMANDS.find(c => c.name === command);
  return cmd?.subcommands?.map(s => s.name) ?? [];
}
