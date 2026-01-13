# 37 - Connector

## Status: ONGOING

Abstract interface to decouple commands from the Klaro API, enabling a
filesystem-based connector for local `.md` files.

## Done

Created `Connector` interface in `src/lib/connector.ts`. `KlaroApi` implements it.

## Next: Abstract Test Suite + LocalConnector

### Testing Strategy

Use `describe.each` to run identical tests against multiple implementations:

```typescript
describe.each([
  ['KlaroApi', createKlaroApiTestContext],
  ['LocalConnector', createLocalConnectorTestContext],
])('%s Connector', (name, createContext) => {
  // Common tests for all implementations
});
```

Each connector provides a test context factory returning:
- `connector`: The connector instance
- `cleanup`: Function to clean up test resources
- `seedData`: Function to populate test data

### LocalConnector Design

Cards organized by a primary dimension (like `.claude/tasks/`):

```
project-root/
├── todo/
│   ├── 1-card-title.md
│   └── 2-another-card.md
├── ongoing/
│   └── 3-active-task.md
├── done/
│   └── 4-completed.md
└── .klaro.json  (config: primary dimension, etc.)
```

### Card File Format (micro spec)

```markdown
---
assignee: Alice
priority: high
---
# Card Title (H1 = title)

Summary paragraph. (first paragraph = summary)

## Idea (subsections = specification)

Details...
```

**Key mapping:**
- `title` = H1 heading
- `summary` = first paragraph after H1
- `specification` = rest of document
- Frontmatter = dimensions only
- Folder = primary dimension value
- Filename = `{identifier}-{slug}.md`

### Connector Method Mapping

| Method | LocalConnector Behavior |
|--------|------------------------|
| `listStories(boardId)` | List .md files (boardId = "all" or folder) |
| `getStories(boardId, ids)` | Find .md by identifier |
| `createStory(boardId, input)` | Create .md in appropriate folder |
| `updateStories(boardId, updates)` | Update frontmatter, move if dimension changes |
| `deleteStories(boardId, ids)` | Delete .md files |
| `listBoards()` | Return folders as "boards" |
| `getBoard(boardId)` | Return folder info |
| `listDimensions()` | Return from .klaro.json |
| `listProjects()` | Return single project |

### Files to Create

1. `src/lib/local-connector.ts` - Filesystem connector
2. `tests/connector.test.ts` - Abstract test suite
3. `tests/utils/connector-test-context.ts` - Test context factories

### Implementation Order

1. Abstract test suite with mock contexts
2. LocalConnector read operations (list, get)
3. LocalConnector write operations (create, update, delete)

## Command Summary

**Commands using Connector** (decoupled):
- `ls`, `read`, `create`, `edit`, `update`, `del`, `describe`, `fetch`, `sync`

**Commands using KlaroApi directly** (auth):
- `login`, `logout`, `whoami`

**Commands not using API**:
- `init`, `use`, `config`, `cheatsheet`
