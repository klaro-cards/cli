## Problem to solve

Users want to use bin/klaro on different project folders, with different
configuration.

And it should be easy to commit it to a git repo.

## Idea

- The config should use ./.klaro instead of ~/.klaro if it exists
- Also we should keep tokens separated (and possibly other secrets), in e.g.
  .klaro/dont-commit-me.json.
- The actual config to use would then be a deepMerge of config.json and
  dont-commit-me.json
