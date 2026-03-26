#!/usr/bin/env node

import { Command, Help } from 'commander';
import { createLoginCommand } from './commands/login.js';
import { createLogoutCommand } from './commands/logout.js';
import { createWhoamiCommand } from './commands/whoami.js';
import { createUseCommand } from './commands/use.js';
import { createLsCommand } from './commands/ls.js';
import { createCreateCommand } from './commands/create.js';
import { createDelCommand } from './commands/del.js';
import { createUpdateCommand, createUpdCommand } from './commands/update.js';
import { createReadCommand } from './commands/read.js';
import { createEditCommand } from './commands/edit.js';
import { createConfigCommand } from './commands/config.js';
import { createInitCommand } from './commands/init.js';
import { createCheatsheetCommand } from './commands/cheatsheet.js';
import { createFetchCommand } from './commands/fetch.js';
import { createSyncCommand } from './commands/sync.js';
import { createDescribeCommand } from './commands/describe.js';
import { createWriteCommand } from './commands/write.js';
import { setTrace } from './lib/trace.js';
import { getProject } from './lib/config.js';
import { setProjectDefault } from './lib/defaults.js';

// Command categories for help organization
const COMMAND_CATEGORIES: Record<string, string[]> = {
  'Setup': ['init', 'login', 'logout', 'whoami', 'use', 'config'],
  'Cards (and other objects)': ['ls', 'read', 'write', 'create', 'edit', 'update', 'del', 'describe'],
  'Offline': ['fetch', 'sync'],
  'Help': ['cheatsheet', 'help'],
};

// Custom Help class to format commands by category
class CategorizedHelp extends Help {
  formatHelp(cmd: Command, helper: Help): string {
    const termWidth = helper.padWidth(cmd, helper);
    const helpWidth = helper.helpWidth ?? 80;
    const itemIndentWidth = 2;
    const itemSeparatorWidth = 2;

    function formatItem(term: string, description: string): string {
      const fullTerm = term.padEnd(termWidth + itemSeparatorWidth);
      if (description) {
        return ' '.repeat(itemIndentWidth) + fullTerm + description;
      }
      return ' '.repeat(itemIndentWidth) + term;
    }

    function formatList(textArray: string[]): string {
      return textArray.join('\n').replace(/^/gm, ' '.repeat(itemIndentWidth));
    }

    let output: string[] = [];

    // Description
    const desc = helper.commandDescription(cmd);
    if (desc) {
      output.push(desc, '');
    }

    // Usage
    const usage = helper.commandUsage(cmd);
    if (usage) {
      output.push(`Usage: ${usage}`, '');
    }

    // Arguments
    const args = helper.visibleArguments(cmd).map(arg => {
      return formatItem(helper.argumentTerm(arg), helper.argumentDescription(arg));
    });
    if (args.length > 0) {
      output.push('Arguments:', args.join('\n'), '');
    }

    // Options
    const opts = helper.visibleOptions(cmd).map(opt => {
      return formatItem(helper.optionTerm(opt), helper.optionDescription(opt));
    });
    if (opts.length > 0) {
      output.push('Options:', opts.join('\n'), '');
    }

    // Commands - organized by category
    const visibleCommands = helper.visibleCommands(cmd);
    if (visibleCommands.length > 0) {
      const commandsByName = new Map(visibleCommands.map(c => [c.name(), c]));
      const usedCommands = new Set<string>();

      // Output commands by category
      for (const [category, commandNames] of Object.entries(COMMAND_CATEGORIES)) {
        const categoryCommands = commandNames
          .filter(name => commandsByName.has(name))
          .map(name => {
            usedCommands.add(name);
            const c = commandsByName.get(name)!;
            return formatItem(helper.subcommandTerm(c), helper.subcommandDescription(c));
          });

        if (categoryCommands.length > 0) {
          output.push(`${category}:`, categoryCommands.join('\n'), '');
        }
      }

      // Any remaining commands not in a category
      const uncategorized = visibleCommands
        .filter(c => !usedCommands.has(c.name()))
        .map(c => formatItem(helper.subcommandTerm(c), helper.subcommandDescription(c)));

      if (uncategorized.length > 0) {
        output.push('Other:', uncategorized.join('\n'), '');
      }
    }

    // Global options note
    const globalNote = helper.visibleGlobalOptions(cmd);
    if (globalNote.length > 0) {
      const globalOpts = globalNote.map(opt => {
        return formatItem(helper.optionTerm(opt), helper.optionDescription(opt));
      });
      output.push('Global Options:', globalOpts.join('\n'), '');
    }

    return output.join('\n');
  }
}

class KlaroCommand extends Command {
  createHelp(): Help {
    return new CategorizedHelp();
  }
}

const program = new KlaroCommand();

program
  .name('klaro')
  .description('Command-line interface for Klaro Cards')
  .version('0.1.0')
  .option('--trace', 'Enable API request/response tracing')
  .option('-p, --project <subdomain>', 'Project subdomain')
  .option('--dims <dimensions>', 'Dimensions to include (comma-separated)')
  .option('--board <board>', 'Board identifier')
  .option('--save-defaults', 'Save --dims and --board as project defaults')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    if (opts.trace) {
      setTrace(true);
    }
    if (opts.saveDefaults) {
      const project = getProject();
      if (project) {
        if (opts.dims) {
          setProjectDefault(project, 'dims', opts.dims);
        }
        if (opts.board) {
          setProjectDefault(project, 'board', opts.board);
        }
      }
    }
  });

program.addCommand(createLoginCommand());
program.addCommand(createLogoutCommand());
program.addCommand(createWhoamiCommand());
program.addCommand(createUseCommand());
program.addCommand(createLsCommand());
program.addCommand(createCreateCommand());
program.addCommand(createDelCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createUpdCommand(), { hidden: true });
program.addCommand(createReadCommand());
program.addCommand(createEditCommand());
program.addCommand(createConfigCommand());
program.addCommand(createInitCommand());
program.addCommand(createCheatsheetCommand());
program.addCommand(createFetchCommand());
program.addCommand(createSyncCommand());
program.addCommand(createWriteCommand());
program.addCommand(createDescribeCommand());

program.parse();
