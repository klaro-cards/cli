# `klaro ls projects` should work without a project set

`klaro ls projects` currently calls `requireProject()`, which throws if no project is configured. Since `listProjects()` hits `/my/projects/` and doesn't depend on a specific project, we can fall back to the `app` subdomain when no project is set.

## Plan

The fix is simple: in `lsProjectsAction`, replace `requireProject()` with `getProjectOrDefault()` so the command works even when no project is configured. The `app` subdomain is the Klaro Cards default that can always reach the API.

## Todo

- [x] Add a `getProjectOrDefault()` helper in `config.ts`
- [x] Use it in `lsProjectsAction` instead of `requireProject()`
- [x] Add unit test for `getProjectOrDefault()`
- [x] Run tests and verify

## Changes

- Added `getProjectOrDefault(cliOption?, fallback='app')` helper in `src/lib/config.ts` that returns the configured project or falls back to `'app'`
- Updated `lsProjectsAction` in `src/commands/ls.ts` to use `getProjectOrDefault()` instead of `requireProject()`
- Added 4 unit tests for the new helper in `tests/config.test.ts`
- Updated ls command test mocks to cover the new behavior
