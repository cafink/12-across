import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DICE, createRandom } from '../site/js/dice.js';
import { generatePuzzle } from '../site/js/puzzle.js';
import { checkBoard } from '../site/js/rules.js';
import { SOLVABLE_FILE } from '../site/js/word-files.js';

const solvable = readFileSync(new URL(`../site/words/${SOLVABLE_FILE}`, import.meta.url), 'utf8').trimEnd().split('\n');
const allowed = new Set(solvable);
const isSolution = ({ letters, solution }) =>
  solution.map(({ letter }) => letter).sort().join('') === letters.join('') &&
  checkBoard(solution, (word) => allowed.has(word)).solved;

test('a dice puzzle comes with a valid solution', () => {
  const puzzle = generatePuzzle(solvable, { random: createRandom(3) });
  assert.equal(puzzle.letters.length, 12);
  assert.ok(puzzle.letters.every((letter) => DICE.some((die) => die.includes(letter))));
  assert.ok(isSolution(puzzle));
});

test('an any-letters puzzle comes with a valid solution', () => {
  const puzzle = generatePuzzle(solvable, { anyLetters: true, random: createRandom(3) });
  assert.equal(puzzle.letters.length, 12);
  assert.ok(isSolution(puzzle));
});

test('the same seed gives the same puzzle', () => {
  assert.deepEqual(generatePuzzle(solvable, { random: createRandom(8) }), generatePuzzle(solvable, { random: createRandom(8) }));
});

test('gives up with an error if no roll can be solved', () => {
  assert.throws(() => generatePuzzle([], { random: createRandom(1) }), /No solvable puzzle found/);
});
