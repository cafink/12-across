# 12 Across

An any-time browser word game: roll 12 letters, then arrange them into one connected crossword using words of 3 or more letters.

## Stack

- Plain HTML, CSS and JavaScript ES modules.  No build step, framework or dependencies.
- Everything the browser loads lives in `site/`.  Tests are in `test/`, developer tools in `tools/`.
- Game logic stays free of DOM access so Node can test it.  Keep UI code thin.

## Running things

All tooling runs in Docker; don't run Node on the host.

- `./test.sh` runs the tests (Node's built-in `node:test`).
- `./serve.sh` serves the site at http://localhost:8000.

## Workflow

- Work happens in small steps, one commit per unit of work, directly on `main`.
- For each step: build it, run the tests, show the changes, and suggest a commit message.  The user runs `git commit` themselves.
- Don't add a license or any mention of one.  Do meet the terms of outside resources, such as the word list notices.

## Game identity

This is an original game.  Don't use the Q-Less name or its exact dice.  Q-Less is mentioned only in the credit.
