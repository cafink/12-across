import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRandom, rollDice } from '../site/js/dice.js';
import { checkBoard } from '../site/js/rules.js';
import { solve } from '../site/js/solver.js';
import { SOLVABLE_FILE } from '../site/js/word-files.js';

const solvable = readFileSync(new URL(`../site/words/${SOLVABLE_FILE}`, import.meta.url), 'utf8').trimEnd().split('\n');
const solvableSet = new Set(solvable);
const SMALL_LIST = ['typical', 'toga', 'box'];
const TYPICAL_TOGA_BOX = [...'typicaltogbx'].sort();

// Check a solution independently of the solver.  The rules module shares no
// code with it, so a bug in the solver can't also hide in the check.
function assertSolves(tiles, letters, words) {
  assert.ok(tiles, `no solution for ${letters.join('')}`);
  assert.deepEqual(tiles.map(({ letter }) => letter).sort(), [...letters].sort());
  const allowed = new Set(words);
  assert.equal(checkBoard(tiles, (word) => allowed.has(word)).solved, true, `bad solution for ${letters.join('')}`);
}

test('solves a roll that has one possible solution', () => {
  assertSolves(solve(TYPICAL_TOGA_BOX, SMALL_LIST), TYPICAL_TOGA_BOX, SMALL_LIST);
});

test('solutions start at row 0 and column 0', () => {
  const tiles = solve(TYPICAL_TOGA_BOX, SMALL_LIST);
  assert.equal(Math.min(...tiles.map(({ row }) => row)), 0);
  assert.equal(Math.min(...tiles.map(({ col }) => col)), 0);
});

test('the same roll always gets the same solution', () => {
  const letters = rollDice(createRandom(5));
  assert.deepEqual(solve(letters, solvable), solve(letters, solvable));
});

test('returns null when no solution is possible', () => {
  assert.equal(solve([...'bcdfghjklmnp'], solvable), null);
});

test('returns null when the step limit runs out', () => {
  assert.equal(solve(TYPICAL_TOGA_BOX, SMALL_LIST, { maxSteps: 0 }), null);
});

test('a single 12-letter word is a solution', () => {
  const letters = [...'grandmothers'];
  assertSolves(solve(letters, ['grandmothers']), letters, ['grandmothers']);
});

test('most dice rolls are solved, and every solution follows the rules', () => {
  const random = createRandom(2026);
  let solved = 0;
  for (let i = 0; i < 30; i++) {
    const letters = rollDice(random);
    const tiles = solve(letters, solvable);
    if (!tiles) continue;
    solved++;
    assertSolves(tiles, letters, solvableSet);
  }
  assert.ok(solved >= 20, `only ${solved} of 30 rolls solved`);
});
