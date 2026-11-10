# 12 Across

Roll twelve letters and arrange them into a single connected crossword.  Every word needs at least three letters, and every letter has to be used.

The game runs entirely in the browser using plain HTML, CSS and JavaScript, with no build step and no dependencies.  Docker is the only thing you need installed.

## Development

```sh
./dev serve   # serve the site at http://localhost:8000
./dev test    # run the tests
./dev words   # rebuild the word lists
./dev bench   # measure puzzle generation
```

## Word lists

`./dev words` builds two lists in `site/words/`:

- The solvability list holds "ordinary" words.  The solver uses it to make sure every puzzle has a solution that doesn't depend on obscure words.
- The validation list is much larger, intended to be comprehensive, and decides which words a player can use.

They're built from these sources in `data/`:

- ENABLE, a public domain word list.
- [SCOWL](https://wordlist.aspell.net/), by Kevin Atkinson and others.  Its copyright notice is in `data/sources/scowl/Copyright` and is published alongside the word lists.
- `solver-exclusions.txt` keeps offensive and odd words off the solvability list.  Players can still use them.
- `extras.txt` adds valid words the sources are missing.

## Credits

12 Across was inspired by [Q-Less](https://q-lessgame.com/), created by Tom Sturdevant, and by [Damien Snyder](https://www.damiensnyder.com/)'s Daily Q-less.  It isn't affiliated with either.

The tests and benchmark use Tommy Ettinger's [Mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c) random number generator, so their rolls can be repeated.
