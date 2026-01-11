# Cheatsheet

`klaro` targets AI agents like Claude Code, that could use it as a commandline
tool.

## Idea

* Helps dumping a cheatsheet that informs agents with typical scenarios ?
* Help writing a SKILL.md file ?
* Simply enhance `klaro --help` to be agent friendly ?

## Implementation

Added `klaro cheatsheet` command that outputs an agent-friendly guide with:
- Introduction paragraph explaining what klaro is
- Common workflow examples organized by task (setup, listing, reading, editing, etc.)
- Tips section with useful hints
- Conclusion pointing to `--help` for more details
