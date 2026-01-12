import { COMMANDS, GLOBAL_OPTIONS, type CommandDef, type OptionDef } from './commands.js';

function formatOptions(options: OptionDef[]): string {
  return options
    .flatMap(o => [o.short, o.long].filter(Boolean))
    .join(' ');
}

function getCommandOptions(cmd: CommandDef): string {
  const opts = [...GLOBAL_OPTIONS, ...(cmd.options ?? [])];
  return formatOptions(opts);
}

export function generateBashCompletion(): string {
  const commandNames = COMMANDS.map(c => c.name).join(' ');

  // Build case statements for subcommands
  const subcommandCases = COMMANDS
    .filter(c => c.subcommands)
    .map(cmd => {
      const subNames = cmd.subcommands!.map(s => s.name).join(' ');
      return `      ${cmd.name})
        COMPREPLY=($(compgen -W "${subNames}" -- "\${cur}"))
        return
        ;;`;
    })
    .join('\n');

  // Build case statements for command options
  const optionCases = COMMANDS
    .map(cmd => {
      const opts = getCommandOptions(cmd);
      return `      ${cmd.name})
        opts="${opts}"
        ;;`;
    })
    .join('\n');

  return `# Bash completion for klaro CLI
# Add to ~/.bashrc: eval "$(klaro completion bash)"

_klaro_completions() {
  local cur prev words cword
  if type _init_completion &>/dev/null; then
    _init_completion || return
  else
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    words=("\${COMP_WORDS[@]}")
    cword=$COMP_CWORD
  fi

  local commands="${commandNames}"
  local global_opts="${formatOptions(GLOBAL_OPTIONS)}"

  # Handle option arguments that need dynamic completion
  case "\${prev}" in
    -p|--project|use)
      local projects
      projects="$(klaro completion --list-projects 2>/dev/null)"
      COMPREPLY=($(compgen -W "\${projects}" -- "\${cur}"))
      return
      ;;
    -b|--board)
      local boards
      boards="$(klaro completion --list-boards 2>/dev/null)"
      COMPREPLY=($(compgen -W "\${boards}" -- "\${cur}"))
      return
      ;;
  esac

  # Find the command (first non-option argument after klaro)
  local cmd=""
  local i=1
  while [[ $i -lt $cword ]]; do
    local word="\${words[$i]}"
    if [[ "\${word}" != -* ]]; then
      cmd="\${word}"
      break
    fi
    # Skip option arguments
    case "\${word}" in
      -p|--project|--board|--dims)
        ((i++))
        ;;
    esac
    ((i++))
  done

  # No command yet - complete commands or global options
  if [[ -z "\${cmd}" ]]; then
    if [[ "\${cur}" == -* ]]; then
      COMPREPLY=($(compgen -W "\${global_opts}" -- "\${cur}"))
    else
      COMPREPLY=($(compgen -W "\${commands}" -- "\${cur}"))
    fi
    return
  fi

  # Find subcommand position
  local subcmd=""
  ((i++))
  while [[ $i -lt $cword ]]; do
    local word="\${words[$i]}"
    if [[ "\${word}" != -* ]]; then
      subcmd="\${word}"
      break
    fi
    ((i++))
  done

  # Complete subcommands if command has them and no subcommand yet
  if [[ -z "\${subcmd}" ]] && [[ "\${cur}" != -* ]]; then
    case "\${cmd}" in
${subcommandCases}
    esac
  fi

  # Complete options based on command
  if [[ "\${cur}" == -* ]]; then
    local opts=""
    case "\${cmd}" in
${optionCases}
    esac
    COMPREPLY=($(compgen -W "\${opts}" -- "\${cur}"))
    return
  fi

  # Default: complete files for commands that accept file arguments
  case "\${cmd}" in
    create)
      COMPREPLY=($(compgen -f -- "\${cur}"))
      ;;
  esac
}

complete -F _klaro_completions klaro
`;
}
