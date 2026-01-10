## Problem to solve

I'd like to build a simple `klaro` client that would help using Klaro Cards's RESTful API to perform various tasks on a Klaro project via the commandline.

## Idea

* The user would be able to login to klaro using `klaro login`
* The token would be kept in `~/.klaro/config.json`
* In the config, the current Klaro project via it's subdomain
* The `klaro` commandline would support a `-p|--project` option to specify
  a subdomain (and use the one in config by default)
* `klaro use SUBDOMAIN]` would help easily switch the default current project

## Technically

* API Doc : https://api.klaro.cards/doc/v1/
* Swagger : https://api.klaro.cards/doc/v1/openapi.json
* Would be installed with `npm install @klarocards/cli`
* We need unit tests

## Typical expected commands

* `klaro ls BOARD` - would list 20 cards in a beautiful table `| Card n° | title |`
* `klaro create [BOARD] -t "qlskjdksqjqd" -d progress=todo` - would create a card
