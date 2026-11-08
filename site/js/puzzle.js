// Making a new puzzle: roll letters, and keep rolling until the solver finds a
// solution using only "ordinary" words.

import { rollAnyLetters, rollDice } from './dice.js';
import { solve } from './solver.js';

// Give up after this many rolls in a row without a solution.  That should
// only happen if something is badly wrong, like an empty word list.
const MAX_ROLLS = 1000;

// Return the rolled letters and a solution.  `words` is the solvability list.
// Options: `anyLetters` picks letters from the whole alphabet instead of
// rolling the dice, `random` is a function like `Math.random`, and `maxSteps`
// limits each search.
export function generatePuzzle(words, { anyLetters = false, random = Math.random, maxSteps } = {}) {
  const roll = anyLetters ? rollAnyLetters : rollDice;
  for (let rolls = 0; rolls < MAX_ROLLS; rolls++) {
    const letters = roll(random);
    const solution = solve(letters, words, { maxSteps });
    if (solution) return { letters, solution };
  }
  throw new Error(`No solvable puzzle found in ${MAX_ROLLS} rolls`);
}
