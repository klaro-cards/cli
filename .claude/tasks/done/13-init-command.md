## Problem to solve

Users need to know about ~/.klaro vs. ./.klaro/

## Idea

Let's introduce a `klaro init` command.

* if the user types `klaro init [-p/--project] .`, it simply ensures we have
  a local `.klaro` folder (with the project set if -p is mentionned)
* if the user types `klaro init [-p/--project] FOLDER, same behavior. The
  folder must exists, an error message is shown otherwise
* if the user types `klaro init [-p/--project]`, the cli asks whether we
  should create a global or local config. If a global config already exists
  nothing happens (if `-p` was mentionned, the project is switched on global
  config, the same a `klaro use PROJECT`).
