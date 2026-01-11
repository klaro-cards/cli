import { createInterface } from 'node:readline';
import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

interface InitOptions {
  project?: string;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function initConfigDir(configDir: string, project?: string): void {
  // Create the .klaro directory
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const configFile = join(configDir, 'config.json');

  // Only write config.json if it doesn't exist or if project is specified
  if (!existsSync(configFile)) {
    const config: Record<string, unknown> = {};
    if (project) {
      config.project = project;
    }
    writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  } else if (project) {
    // Update existing config with project
    const content = existsSync(configFile)
      ? JSON.parse(readFileSync(configFile, 'utf-8'))
      : {};
    content.project = project;
    writeFileSync(configFile, JSON.stringify(content, null, 2), 'utf-8');
  }
}

function getGlobalConfigDir(): string {
  const home = process.env.KLARO_HOME ?? homedir();
  return join(home, '.klaro');
}

async function initAction(folder: string | undefined, options: InitOptions): Promise<void> {
  try {
    const project = options.project;

    if (folder) {
      // klaro init . or klaro init FOLDER
      const targetDir = resolve(folder);

      if (!existsSync(targetDir)) {
        console.error(`Error: Directory "${folder}" does not exist.`);
        process.exit(1);
        return;
      }

      const configDir = join(targetDir, '.klaro');
      initConfigDir(configDir, project);

      console.log(`Initialized local config in ${configDir}`);
      if (project) {
        console.log(`Project set to "${project}"`);
      }
    } else {
      // klaro init (interactive)
      const globalDir = getGlobalConfigDir();
      const localDir = join(process.cwd(), '.klaro');
      const globalExists = existsSync(globalDir);
      const localExists = existsSync(localDir);

      if (globalExists && !project) {
        console.log(`Global config already exists at ${globalDir}`);
        console.log('Use "klaro init ." to create a local config in the current directory.');
        return;
      }

      if (globalExists && project) {
        // Just update the project in global config
        initConfigDir(globalDir, project);
        console.log(`Project set to "${project}" in global config`);
        return;
      }

      // No global config exists, ask the user
      console.log('No configuration found.');
      console.log('');
      console.log('  1) Global config (~/.klaro) - shared across all projects');
      console.log('  2) Local config (./.klaro) - specific to this directory');
      console.log('');

      const answer = await prompt('Choose (1 or 2): ');

      if (answer === '1') {
        initConfigDir(globalDir, project);
        console.log(`Initialized global config in ${globalDir}`);
      } else if (answer === '2') {
        initConfigDir(localDir, project);
        console.log(`Initialized local config in ${localDir}`);
      } else {
        console.error('Invalid choice. Please enter 1 or 2.');
        process.exit(1);
        return;
      }

      if (project) {
        console.log(`Project set to "${project}"`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize Klaro configuration')
    .argument('[folder]', 'Directory to initialize (default: interactive)')
    .option('-p, --project <subdomain>', 'Set the project subdomain')
    .action(initAction);
}
