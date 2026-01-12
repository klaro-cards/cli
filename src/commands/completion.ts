import { Command } from 'commander';
import { generateBashCompletion } from '../completions/bash.js';
import { generateZshCompletion } from '../completions/zsh.js';
import { generateFishCompletion } from '../completions/fish.js';
import {
  getCachedProjects,
  getCachedBoards,
  setCachedProjects,
  setCachedBoards,
  needsProjectsRefresh,
  needsBoardsRefresh,
} from '../lib/completion-cache.js';
import { createClient } from '../lib/api.js';
import { getToken, getProject } from '../lib/config.js';

type Shell = 'bash' | 'zsh' | 'fish';

function detectShell(): Shell | null {
  const shell = process.env.SHELL ?? '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('fish')) return 'fish';
  return null;
}

function generateCompletion(shell: Shell): string {
  switch (shell) {
    case 'bash':
      return generateBashCompletion();
    case 'zsh':
      return generateZshCompletion();
    case 'fish':
      return generateFishCompletion();
  }
}

async function refreshCache(): Promise<void> {
  const token = getToken();
  const project = getProject();

  if (!token) {
    console.error('Not logged in. Run "klaro login" first to enable dynamic completions.');
    return;
  }

  // Refresh projects
  try {
    const api = createClient(project ?? 'app', token);
    const projects = await api.listProjects();
    setCachedProjects(projects.map(p => ({ subdomain: p.subdomain, label: p.label })));
    console.log(`Cached ${projects.length} project(s)`);
  } catch (error) {
    console.error('Failed to refresh projects cache');
  }

  // Refresh boards for current project
  if (project) {
    try {
      const api = createClient(project, token);
      const boards = await api.listBoards();
      setCachedBoards(project, boards.map(b => ({ identifier: b.identifier, label: b.label })));
      console.log(`Cached ${boards.length} board(s) for project "${project}"`);
    } catch (error) {
      console.error(`Failed to refresh boards cache for project "${project}"`);
    }
  }
}

interface CompletionOptions {
  listProjects?: boolean;
  listBoards?: boolean;
}

async function completionAction(shell: string | undefined, options: CompletionOptions): Promise<void> {
  // Handle internal options for shell scripts
  if (options.listProjects) {
    const projects = getCachedProjects();
    if (projects.length > 0) {
      console.log(projects.join('\n'));
    } else {
      // Try to refresh cache silently
      const token = getToken();
      if (token) {
        try {
          const api = createClient(getProject() ?? 'app', token);
          const freshProjects = await api.listProjects();
          setCachedProjects(freshProjects.map(p => ({ subdomain: p.subdomain, label: p.label })));
          console.log(freshProjects.map(p => p.subdomain).join('\n'));
        } catch {
          // Silent failure
        }
      }
    }
    return;
  }

  if (options.listBoards) {
    const project = getProject();
    if (!project) return;
    const boards = getCachedBoards(project);
    if (boards.length > 0) {
      console.log(boards.join('\n'));
    } else {
      // Try to refresh cache silently
      const token = getToken();
      if (token) {
        try {
          const api = createClient(project, token);
          const freshBoards = await api.listBoards();
          setCachedBoards(project, freshBoards.map(b => ({ identifier: b.identifier, label: b.label })));
          console.log(freshBoards.map(b => b.identifier).join('\n'));
        } catch {
          // Silent failure
        }
      }
    }
    return;
  }

  // No shell specified, detect or prompt
  if (!shell) {
    const detected = detectShell();
    if (detected) {
      console.log(generateCompletion(detected));
    } else {
      console.error('Could not detect shell. Please specify: klaro completion bash|zsh|fish');
      process.exit(1);
    }
    return;
  }

  // Validate shell argument
  if (!['bash', 'zsh', 'fish'].includes(shell)) {
    console.error(`Unknown shell: ${shell}. Supported shells: bash, zsh, fish`);
    process.exit(1);
    return;
  }

  console.log(generateCompletion(shell as Shell));
}

async function refreshAction(): Promise<void> {
  await refreshCache();
}

async function installAction(): Promise<void> {
  const shell = detectShell();
  if (!shell) {
    console.error('Could not detect shell. Please add completion manually.');
    console.error('');
    console.error('Bash: Add to ~/.bashrc:');
    console.error('  eval "$(klaro completion bash)"');
    console.error('');
    console.error('Zsh: Add to ~/.zshrc:');
    console.error('  eval "$(klaro completion zsh)"');
    console.error('');
    console.error('Fish: Add to ~/.config/fish/config.fish:');
    console.error('  klaro completion fish | source');
    process.exit(1);
    return;
  }

  console.log(`Detected shell: ${shell}`);
  console.log('');
  console.log('Add the following line to your shell configuration:');
  console.log('');

  switch (shell) {
    case 'bash':
      console.log('  # Add to ~/.bashrc');
      console.log('  eval "$(klaro completion bash)"');
      break;
    case 'zsh':
      console.log('  # Add to ~/.zshrc');
      console.log('  eval "$(klaro completion zsh)"');
      break;
    case 'fish':
      console.log('  # Add to ~/.config/fish/config.fish');
      console.log('  klaro completion fish | source');
      break;
  }

  console.log('');
  console.log('Then restart your shell or source the config file.');
}

export function createCompletionCommand(): Command {
  const cmd = new Command('completion')
    .description('Generate shell completion scripts')
    .argument('[shell]', 'Shell type (bash, zsh, fish)')
    .option('--list-projects', 'List cached projects (internal)', false)
    .option('--list-boards', 'List cached boards (internal)', false)
    .action(completionAction);

  cmd.addCommand(
    new Command('bash')
      .description('Generate bash completions')
      .action(() => console.log(generateBashCompletion()))
  );

  cmd.addCommand(
    new Command('zsh')
      .description('Generate zsh completions')
      .action(() => console.log(generateZshCompletion()))
  );

  cmd.addCommand(
    new Command('fish')
      .description('Generate fish completions')
      .action(() => console.log(generateFishCompletion()))
  );

  cmd.addCommand(
    new Command('install')
      .description('Show installation instructions')
      .action(installAction)
  );

  cmd.addCommand(
    new Command('refresh')
      .description('Refresh completion cache')
      .action(refreshAction)
  );

  return cmd;
}
