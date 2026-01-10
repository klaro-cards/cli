## Status: DONE

## Problem to solve

Having to specify the board all the time may be annoying.

## Idea

* --board used in `ls` and `created` should be `all` by default
* More generally, the user should be able to configure default values for usual
  parameters
* Those parameters would be kept in config.json, on a per-project basis

## Technically

Make sure to create the necsssary abstractions so that different commands can
reuse the default options set on a project basis.

## Implementation

- Added `ProjectDefaults` interface to `src/lib/types.ts`
- Created `src/lib/defaults.ts` with reusable default resolution functions
- Updated `ls` and `create` commands to use optional `--board` with default `'all'`
- Added `klaro config` command with `set`, `unset`, and `list` subcommands
- Per-project defaults stored in `config.json` under `projectDefaults` key
