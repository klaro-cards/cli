## Problem to solve

We would also like to list projects and boards, not only cards.

## Idea

* `klaro ls` is a shortcut for `klaro ls cards`
* We also have `klaro ls projects` and `klaro ls boards`

## Technically

* projects : `GET /my/projects/`
* boards : `GET /my/boards/`
* In each case, we should take the result and make it a Bmg Relation and use toText
  (very similar to cards)
* We can hardcode some attributes to `project` on in each case.
