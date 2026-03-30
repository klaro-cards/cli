import { Command } from 'commander';
import { Bmg } from '@enspirit/bmg-js';
import { renderMarkdown } from '../utils/markdown.js';

const INTRO = `Klaro CLI is a command-line interface for managing cards on Klaro Cards.
It is designed to be AI-agent friendly, enabling seamless integration with
tools like Claude Code for backlog, task and project management workflows.`;

const TIPS = `- Use \`--raw\` with \`read\` to get plain markdown without highlighting
- Use \`write\` instead of \`edit\` when scripting or running from an AI agent
- Cards are identified by their numeric identifier (shown in ls output)
- Most commands support \`-p <project>\` to override the active project

Run \`klaro --help\` for all available commands and options.
Run \`klaro <command> --help\` for detailed help on a specific command.`;

const EXAMPLES = Bmg([
  { category: 'Setup', example: 'klaro init .', explanation: 'Initialize klaro in current directory' },
  { category: 'Setup', example: 'klaro login', explanation: 'Authenticate with email/password' },
  { category: 'Setup', example: 'klaro use <project>', explanation: 'Set active project by subdomain' },
  { category: 'Listing', example: 'klaro ls', explanation: 'List cards (default board: all)' },
  { category: 'Listing', example: 'klaro ls -b backlog', explanation: 'List from specific board' },
  { category: 'Listing', example: 'klaro ls --dims progress', explanation: 'Show specific dimensions' },
  { category: 'Listing', example: 'klaro ls --filter status=open', explanation: 'Filter by dimension value' },
  { category: 'Listing', example: 'klaro ls projects', explanation: 'List available projects' },
  { category: 'Listing', example: 'klaro ls boards', explanation: 'List boards in project' },
  { category: 'Listing', example: 'klaro ls dimensions', explanation: 'List dimensions in project' },
  { category: 'Listing', example: 'klaro ls attachments 1', explanation: 'List attachments on a card' },
  { category: 'Reading', example: 'klaro read 1', explanation: 'Read card as markdown' },
  { category: 'Reading', example: 'klaro read 1 2 3', explanation: 'Read multiple cards' },
  { category: 'Reading', example: 'klaro read 1 --dims progress', explanation: 'Include dimensions in output' },
  { category: 'Editing', example: 'klaro edit 1', explanation: 'Edit card in $EDITOR' },
  { category: 'Editing', example: 'klaro edit 1 2 3', explanation: 'Edit multiple cards sequentially' },
  { category: 'Editing', example: 'klaro edit 1 --dims progress', explanation: 'Include dimensions in editor' },
  { category: 'Writing', example: 'klaro write 1 -f card.md', explanation: 'Update card from markdown file' },
  { category: 'Writing', example: 'klaro read 1 --raw | klaro write 1', explanation: 'Pipe read output back after changes' },
  { category: 'Creating', example: 'klaro create "Card title"', explanation: 'Create new card with title' },
  { category: 'Creating', example: 'klaro create @card.md', explanation: 'Create from markdown file' },
  { category: 'Creating', example: 'cat card.md | klaro create', explanation: 'Create from stdin' },
  { category: 'Creating', example: 'klaro create "Title" -b backlog', explanation: 'Create in specific board' },
  { category: 'Duplicating', example: 'klaro read 3 | klaro create', explanation: 'Duplicate card 3' },
  { category: 'Duplicating', example: 'klaro read 3 | klaro create assignee=Bob', explanation: 'Duplicate and reassign' },
  { category: 'Updating', example: 'klaro update 1 progress=done', explanation: 'Update a dimension' },
  { category: 'Updating', example: 'klaro upd 1 2 3 progress=done', explanation: 'Update multiple cards' },
  { category: 'Updating', example: 'klaro del 1', explanation: 'Delete a card' },
  { category: 'Attachments', example: 'klaro attach 1 photo.jpg', explanation: 'Attach a file to a card' },
  { category: 'Attachments', example: 'klaro attach 1 a.jpg b.pdf', explanation: 'Attach multiple files at once' },
  { category: 'Attachments', example: 'klaro attach 1 cover.jpg --cover', explanation: 'Set as card cover image' },
  { category: 'Attachments', example: 'klaro attach 1 doc.pdf -d "Spec"', explanation: 'Attach with description' },
  { category: 'Attachments', example: 'klaro detach 1 <uuid>', explanation: 'Remove attachment and its seshat file' },
  { category: 'Attachments', example: 'klaro detach 1 <uuid> --keep-file', explanation: 'Remove attachment, keep seshat file' },
  { category: 'Attachments', example: 'klaro detach 1 /s/file.png?n=f.png', explanation: 'Remove attachment by seshat URL' },
  { category: 'Offline', example: 'klaro fetch 1 2 3', explanation: 'Download cards as markdown files' },
  { category: 'Offline', example: 'klaro fetch 1 --dims progress', explanation: 'Include dimensions in downloaded files' },
  { category: 'Offline', example: 'klaro sync', explanation: 'Upload changes and delete local files' },
  { category: 'Offline', example: 'klaro sync --keep', explanation: 'Upload changes but keep local files' },
  { category: 'Defaults', example: 'klaro config set board backlog', explanation: 'Set default board' },
  { category: 'Defaults', example: 'klaro config set dims progress,assignee', explanation: 'Set default dimensions' },
  { category: 'Defaults', example: 'klaro config set api_url http://api.klaro.devel', explanation: 'Use a different Klaro instance' },
  { category: 'Defaults', example: 'klaro --save-defaults ls --dims progress', explanation: 'Save defaults as you go' },
  { category: 'Defaults', example: 'klaro config list', explanation: 'View saved defaults' },
]).group(['example', 'explanation'], 'examples', { allbut: true });

function buildCheatsheet(table: boolean): string {
  const lines: string[] = ['# Klaro CLI', '', INTRO, ''];

  if (table) {
    lines.push(EXAMPLES.toText({ border: 'rounded' }));
  } else {
    for (const { category, examples } of EXAMPLES.tuples) {
      lines.push(`## ${category}`, '');
      for (const { example, explanation } of examples.tuples) {
        lines.push(`${example.padEnd(45)} # ${explanation}`);
      }
      lines.push('');
    }
  }

  lines.push('## Tips', '', TIPS);
  return lines.join('\n');
}

interface CheatsheetOptions {
  table?: boolean;
  raw?: boolean;
}

export function createCheatsheetCommand(): Command {
  return new Command('cheatsheet')
    .description('Display a quick reference guide')
    .option('--table', 'Display in table format (for humans)')
    .option('--raw', 'Output without syntax highlighting')
    .action((options: CheatsheetOptions) => {
      const content = buildCheatsheet(options.table ?? false);
      if (options.raw) {
        console.log(content);
      } else {
        console.log(renderMarkdown(content));
      }
    });
}
