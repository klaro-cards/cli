import { Command } from 'commander';

/**
 * Wraps a subcommand with a parent program that has global options.
 * This simulates how commands work in the actual CLI where -p, --board, etc.
 * are defined on the parent program.
 */
export function wrapWithGlobalOptions(subcommand: Command): Command {
  const program = new Command();
  program
    .option('-p, --project <subdomain>', 'Project subdomain')
    .option('--board <board>', 'Board identifier')
    .option('--dims <dimensions>', 'Dimensions to include');
  program.addCommand(subcommand, { isDefault: true });
  return program;
}
