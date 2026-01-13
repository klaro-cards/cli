import chalk from 'chalk';
import { Command } from 'commander';
import { createClient, KlaroApiError } from '../lib/api.js';
import { requireProject, requireToken } from '../lib/config.js';
import { printTable } from '../utils/table.js';

async function describeDimensionAction(dimensionCode: string, _options: unknown, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();

    const api = createClient(project, token);
    const dimensions = await api.listDimensions();

    const dimension = dimensions.find(d => d.code === dimensionCode);

    if (!dimension) {
      console.error(`Error: Dimension "${dimensionCode}" not found`);
      process.exit(1);
      return;
    }

    // Display dimension header
    console.log(chalk.bold('Dimension:'), dimension.label ?? dimension.code);
    console.log(chalk.bold('Datatype:'), dimension.datatype);

    // Display values if present
    if (dimension.values && dimension.values.length > 0) {
      console.log(chalk.bold('\nValues:'));
      const valuesData = dimension.values.map(v => ({
        id: v.id ?? '-',
        label: v.label ?? '-',
      }));
      printTable(valuesData, ['id', 'label']);
      console.log(`\nTotal: ${dimension.values.length} value(s)`);
    } else {
      console.log('\nNo predefined values (free-form input)');
    }
  } catch (error) {
    if (error instanceof KlaroApiError) {
      console.error(`Error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

async function describeBoardAction(boardId: string, _options: unknown, command: Command): Promise<void> {
  try {
    const globalOpts = command.optsWithGlobals();
    const project = requireProject(globalOpts.project);
    const token = requireToken();

    const api = createClient(project, token);
    const board = await api.getBoard(boardId);

    // Display board header
    console.log(chalk.bold('Board:'), board.label);
    console.log(chalk.bold('Location:'), board.location);

    // Display filters if present
    const filterEntries = Object.entries(board.filters ?? {});
    if (filterEntries.length > 0) {
      console.log(chalk.bold('\nFilters:'));
      const filtersData = filterEntries.map(([dimension, values]) => ({
        dimension,
        values: values.join(', '),
      }));
      printTable(filtersData, ['dimension', 'values']);
    } else {
      console.log('\nNo filters configured');
    }
  } catch (error) {
    if (error instanceof KlaroApiError) {
      console.error(`Error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

function createDimensionSubcommand(isDefault = false): Command {
  return new Command('dimension')
    .description('Show detailed information about a dimension' + (isDefault ? ' (default)' : ''))
    .argument('<code>', 'Dimension code to describe')
    .action(describeDimensionAction);
}

function createBoardSubcommand(): Command {
  return new Command('board')
    .description('Show detailed information about a board')
    .argument('<id>', 'Board identifier to describe')
    .action(describeBoardAction);
}

export function createDescribeCommand(): Command {
  const cmd = new Command('describe')
    .description('Show detailed information about a dimension or board');

  cmd.addCommand(createDimensionSubcommand(true), { isDefault: true });
  cmd.addCommand(createBoardSubcommand());

  return cmd;
}
