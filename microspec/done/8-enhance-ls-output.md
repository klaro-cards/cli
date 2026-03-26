## Status: DONE

## Problem to solve

When `ls` is used, we see the cards, but might not know which boards
we are looking at

## Idea

Replace `Showing 16 card(s)` by `Showing 16 card(s) in board {board}`

Same for `del` : `Deleted 2 cards: 11, 13` by `Deleted 2 cards: 11, 13 in board {board}`

## Implementation

Updated output messages in both `ls` and `del` commands to include board name.
