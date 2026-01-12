import { COMMANDS, GLOBAL_OPTIONS, type CommandDef, type OptionDef } from './commands.js';

function formatOption(opt: OptionDef, cmd?: string): string {
  const parts: string[] = ['complete -c klaro'];

  if (cmd) {
    parts.push(`-n "__fish_seen_subcommand_from ${cmd}"`);
  } else {
    parts.push('-n "__fish_use_subcommand"');
  }

  if (opt.short) {
    parts.push(`-s ${opt.short.replace('-', '')}`);
  }
  if (opt.long) {
    parts.push(`-l ${opt.long.replace('--', '')}`);
  }
  parts.push(`-d '${opt.description}'`);

  if (opt.takesArg === 'projects') {
    parts.push('-xa "(klaro completion --list-projects 2>/dev/null)"');
  } else if (opt.takesArg === 'boards') {
    parts.push('-xa "(klaro completion --list-boards 2>/dev/null)"');
  } else if (opt.takesArg === 'files') {
    parts.push('-r');
  } else if (opt.takesArg === 'string') {
    parts.push('-r');
  }

  return parts.join(' ');
}

function generateCommandCompletion(cmd: CommandDef): string[] {
  const lines: string[] = [];

  // Command itself
  lines.push(`complete -c klaro -n "__fish_use_subcommand" -a "${cmd.name}" -d '${cmd.description}'`);

  // Subcommands
  if (cmd.subcommands) {
    for (const sub of cmd.subcommands) {
      lines.push(`complete -c klaro -n "__fish_seen_subcommand_from ${cmd.name}; and not __fish_seen_subcommand_from ${cmd.subcommands.map(s => s.name).join(' ')}" -a "${sub.name}" -d '${sub.description}'`);
    }
  }

  // Command-specific options
  if (cmd.options) {
    for (const opt of cmd.options) {
      lines.push(formatOption(opt, cmd.name));
    }
  }

  // Argument completion based on command
  if (cmd.takesArgs === 'projects') {
    lines.push(`complete -c klaro -n "__fish_seen_subcommand_from ${cmd.name}" -xa "(klaro completion --list-projects 2>/dev/null)"`);
  } else if (cmd.takesArgs === 'files') {
    lines.push(`complete -c klaro -n "__fish_seen_subcommand_from ${cmd.name}" -F`);
  }

  return lines;
}

export function generateFishCompletion(): string {
  const lines: string[] = [
    '# Fish completion for klaro CLI',
    '# Add to ~/.config/fish/config.fish: klaro completion fish | source',
    '',
    '# Disable file completion by default',
    'complete -c klaro -f',
    '',
    '# Global options (available for all commands)',
  ];

  // Global options
  for (const opt of GLOBAL_OPTIONS) {
    lines.push(formatOption(opt));
  }

  lines.push('');
  lines.push('# Commands and their options');

  // Commands
  for (const cmd of COMMANDS) {
    lines.push('');
    lines.push(`# ${cmd.name}`);
    lines.push(...generateCommandCompletion(cmd));
  }

  // Special handling for 'use' command argument
  lines.push('');
  lines.push('# Dynamic completions for use command');
  lines.push('complete -c klaro -n "__fish_seen_subcommand_from use" -xa "(klaro completion --list-projects 2>/dev/null)"');

  return lines.join('\n') + '\n';
}
