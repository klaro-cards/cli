## Problem to solve

Running the tests actually removes the ~/.klaro/config.json on the computer
where those tests are run, invalidating any real cli klaro session.

## Idea

Do whatever is needed to ensure that tests work on a mocked/fakes/configurable
home dir, with `~/.klaro` as default value.

Could be an option of `bin/klaro`.

## Solution implemented

Added support for `KLARO_HOME` environment variable in `src/lib/config.ts`:
- When `KLARO_HOME` is set, config is stored at `$KLARO_HOME/.klaro/config.json`
- When not set, falls back to default `~/.klaro/config.json`

Updated `tests/acceptance.test.ts`:
- Creates a temporary directory using `mkdtempSync`
- Passes `KLARO_HOME` to all spawned CLI processes
- Cleans up the temporary directory in `afterAll`

Added test coverage in `tests/config.test.ts`:
- Test verifies `KLARO_HOME` env var is respected by `getConfigPath()`

## Status: Complete

All tests pass. Acceptance tests now use isolated config directories and won't affect
the user's real `~/.klaro/config.json`.
