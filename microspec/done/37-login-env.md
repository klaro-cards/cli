---
status: DONE
---

# Login --env flag

Add `--env` option to `klaro login` that reads credentials from `KLARO_LOGIN` and `KLARO_PASSWORD` environment variables, bypassing interactive prompts.

## Subtasks

- [x] Add `--env` flag to login command
- [x] Add `credentialsFromEnv()` function
- [x] Add unit tests
