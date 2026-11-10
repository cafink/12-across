# 12 Across

An any-time browser word game: roll 12 letters, then arrange them into one connected crossword using words of 3 or more letters.

## Stack

- Plain HTML, CSS and JavaScript ES modules.  No build step, framework or dependencies.
- Everything the browser loads lives in `site/`.  Tests are in `test/`, developer tools in `tools/`.
- Game logic stays free of DOM access so Node can test it.  Keep UI code thin.

## Running things

All tooling runs in Docker; don't run Node on the host.

- `./dev test` runs the tests (Node's built-in `node:test`).
- `./dev serve` serves the site at http://localhost:8000.
- `./dev words` rebuilds the word lists.  Run it after changing anything in `data/`, and commit the results.
- `./dev bench` measures puzzle generation.  Run it after changing the solver, the dice or the word lists, because the tests only use a small sample of rolls.
- Run `./dev` with no arguments to list all commands.
- Add new commands to the `dev` script instead of creating separate scripts.

## Workflow

- Work happens in small steps, one commit per unit of work, directly on `main`.
- Pushing `main` publishes `site/` to GitHub Pages (`.github/workflows/pages.yml`), so whatever is on `main` when it's pushed goes live.  Small steps that are ready to publish can still go straight to `main`.  Put longer features, or anything that shouldn't be live yet, on a branch and merge it when it's ready.
- For each step: build it, run the tests, show the changes, and suggest a commit message.  The user runs `git commit` themselves.
- Don't add a license or any mention of one.  Do meet the terms of outside resources, such as the word list notices.

## Game identity

This is an original game.  Don't use the Q-Less name or its exact dice.  Q-Less is mentioned only in the credit.
