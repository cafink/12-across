// Rolling the 12 letters for a puzzle.

// Our own set of 12 dice.  The first two are all vowels and the third is half
// vowels, so every roll has 2 or 3 vowels, plus sometimes a Y.  There's no Q.
export const DICE = [
  'aaeiou',
  'aeeioo',
  'eiuyrs',
  'tnrlsd',
  'hnlrtg',
  'dmcbpw',
  'ftghly',
  'lcmzsb',
  'pkdgrv',
  'tcjhwf',
  'nxbkmd',
  'rlnpsv',
];

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const LETTER_COUNT = 12;

// Return a random number generator that always gives the same sequence for the
// same seed, so a roll can be replayed.  It uses Tommy Ettinger's Mulberry32
// algorithm, which is public domain.  It's fast and plenty random for a game.
// Each call returns a number from 0 up to, but not including, 1.
export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(text, random) {
  return text[Math.floor(random() * text.length)];
}

// The roll functions take a random function: one that takes no arguments and
// returns a number from 0 up to, but not including, 1, like Math.random.  The
// game passes Math.random itself, and tests pass one from createRandom so their
// rolls repeat.

// Roll one letter from each die.  The letters come back in alphabetical order,
// so the result doesn't reveal which die gave which letter.
export function rollDice(random) {
  return DICE.map((die) => pick(die, random)).sort();
}

// Pick 12 letters from the whole alphabet, each equally likely.  Any letter can
// appear, including Q, and letters can repeat.
export function rollAnyLetters(random) {
  return Array.from({ length: LETTER_COUNT }, () => pick(ALPHABET, random)).sort();
}
