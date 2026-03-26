# List dimensions

Users need to see the list of dimensions available on a project.

## Idea

* `klaro list dimensions` would show them
* We need the code, name, datatype, and values (ids) at least.

## Implementation

- Added `Dimension` interface to types.ts with values containing id, code, label
- Added `listDimensions()` method to API (`/dimensions/`)
- Added `ls dimensions` subcommand showing code, name, datatype, values columns
- Values formatted as comma-separated IDs
