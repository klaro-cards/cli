## Save defaults

Would be nice to save default options as we go.

## Idea

The following scenario works fine

```
klaro --show assignee,progress ls
klaro --show assignee,progress read 1
```

Would be even better to also support this

```
klaro --show assignee,progress --save-defaults ls
klaro read 1
```

And obtain the same effect.

Of course `--save-defaults` would only save the options specified, and
keep other defaults unchanged.

## Implementation

- Added `--save-defaults` global option
- When specified, saves `--show` and `--board` values to project defaults
- Uses existing `setProjectDefault` from defaults module
- Subsequent commands automatically pick up saved defaults via `resolveShow`/`resolveBoard`
