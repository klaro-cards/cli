#!/usr/bin/env node

import { Command } from 'commander';
import { createLoginCommand } from './commands/login.js';
import { createLogoutCommand } from './commands/logout.js';
import { createWhoamiCommand } from './commands/whoami.js';
import { createUseCommand } from './commands/use.js';
import { createLsCommand } from './commands/ls.js';
import { createCreateCommand } from './commands/create.js';
import { createDelCommand } from './commands/del.js';
import { createSetCommand } from './commands/set.js';
import { createConfigCommand } from './commands/config.js';
import { setTrace } from './lib/trace.js';

const program = new Command();

program
  .name('klaro')
  .description('Command-line interface for Klaro Cards')
  .version('0.1.0')
  .option('--trace', 'Enable API request/response tracing')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    if (opts.trace) {
      setTrace(true);
    }
  });

program.addCommand(createLoginCommand());
program.addCommand(createLogoutCommand());
program.addCommand(createWhoamiCommand());
program.addCommand(createUseCommand());
program.addCommand(createLsCommand());
program.addCommand(createCreateCommand());
program.addCommand(createDelCommand());
program.addCommand(createSetCommand());
program.addCommand(createConfigCommand());

program.parse();
