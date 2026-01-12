import { COMMANDS, GLOBAL_OPTIONS, type CommandDef, type OptionDef } from './commands.js';

function formatOption(opt: OptionDef): string {
  let argSpec = '';
  if (opt.takesArg === 'projects') {
    argSpec = ':project:_klaro_projects';
  } else if (opt.takesArg === 'boards') {
    argSpec = ':board:_klaro_boards';
  } else if (opt.takesArg === 'files') {
    argSpec = ':file:_files';
  } else if (opt.takesArg === 'string') {
    argSpec = ':value:';
  }

  if (opt.short && opt.long) {
    // Format: '(-p --project)'{-p,--project}'[desc]:arg:action'
    return `'(${opt.short} ${opt.long})'{${opt.short},${opt.long}}'[${opt.description}]${argSpec}'`;
  } else {
    // Format: '--option[desc]:arg:action'
    return `'${opt.long}[${opt.description}]${argSpec}'`;
  }
}

function formatOptionsForCommand(cmd: CommandDef): string {
  const opts = [...GLOBAL_OPTIONS, ...(cmd.options ?? [])];
  return opts.map(o => formatOption(o)).join(' ');
}

export function generateZshCompletion(): string {
  // Generate command descriptions
  const commandDescs = COMMANDS
    .map(c => `      '${c.name}:${c.description}'`)
    .join(' \\\n');

  // Generate subcommand functions
  const subcommandFuncs = COMMANDS
    .filter(c => c.subcommands)
    .map(cmd => {
      const subDescs = cmd.subcommands!
        .map(s => `      '${s.name}:${s.description}'`)
        .join(' \\\n');
      return `_klaro_${cmd.name}() {
  local -a subcmds
  subcmds=(
${subDescs}
  )
  _describe -t commands '${cmd.name} subcommand' subcmds
}`;
    })
    .join('\n\n');

  // Generate command completion cases
  const commandCases = COMMANDS
    .map(cmd => {
      if (cmd.subcommands) {
        return `      ${cmd.name})
        _klaro_${cmd.name}
        ;;`;
      }
      const opts = formatOptionsForCommand(cmd);
      // Note: We skip variadic argument specs (*:) as they cause issues with eval
      // Users can still type identifiers/files, they just won't get completion
      let args = '';
      if (cmd.takesArgs === 'projects') {
        args = " ':project:_klaro_projects'";
      }
      return `      ${cmd.name})
        _arguments -s ${opts}${args}
        ;;`;
    })
    .join('\n');

  return `#compdef klaro
# Zsh completion for klaro CLI
# Add to ~/.zshrc: eval "$(klaro completion zsh)"

_klaro_projects() {
  local -a projects
  projects=(\${(f)"$(klaro completion --list-projects 2>/dev/null)"})
  _describe -t projects 'project' projects
}

_klaro_boards() {
  local -a boards
  boards=(\${(f)"$(klaro completion --list-boards 2>/dev/null)"})
  _describe -t boards 'board' boards
}

${subcommandFuncs}

_klaro() {
  local curcontext="\$curcontext" state line
  typeset -A opt_args

  _arguments -C '(-p --project)'{-p,--project}'[Project subdomain]:project:_klaro_projects' '--trace[Enable API request logging]' '--dims[Dimensions to display]:dimensions:' '--board[Board identifier]:board:_klaro_boards' '--save-defaults[Save dims and board as defaults]' '1:command:->command' '*::arg:->args'

  case "\$state" in
    command)
      local -a commands
      commands=(
${commandDescs}
      )
      _describe -t commands 'klaro command' commands
      ;;
    args)
      case "\$line[1]" in
${commandCases}
      esac
      ;;
  esac
}

compdef _klaro klaro
`;
}
