import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRandom } from '../site/js/dice.js';
import { BOARD_SIZE, RACK_SLOTS, placedTiles, rackTiles, startGame } from '../site/js/game.js';
import { generatePuzzle } from '../site/js/puzzle.js';
import { SOLVABLE_FILE } from '../site/js/word-files.js';

const solvable = readFileSync(new URL(`../site/words/${SOLVABLE_FILE}`, import.meta.url), 'utf8').trimEnd().split('\n');
const puzzle = { letters: [...'aabeiklmnrst'], solution: [] };

test('a new game starts with every tile in the rack', () => {
  const game = startGame(puzzle, createRandom(1));
  assert.equal(rackTiles(game).length, 12);
  assert.deepEqual(placedTiles(game), []);
});

test('every tile gets its own rack slot', () => {
  const slots = rackTiles(startGame(puzzle, createRandom(1))).map(({ slot }) => slot);
  assert.deepEqual([...slots].sort((a, b) => a - b), [...Array(RACK_SLOTS).keys()]);
});

test('the tiles are shuffled into the rack', () => {
  const bySlot = (game) => rackTiles(game).sort((a, b) => a.slot - b.slot).map(({ letter }) => letter).join('');
  const orders = new Set(Array.from({ length: 20 }, (_, seed) => bySlot(startGame(puzzle, createRandom(seed)))));
  assert.ok(orders.size > 15, `only ${orders.size} different orders`);
});

test('the same random function gives the same rack', () => {
  assert.deepEqual(startGame(puzzle, createRandom(4)), startGame(puzzle, createRandom(4)));
});

test('every tile has its own id, even with repeated letters', () => {
  const ids = startGame(puzzle, createRandom(1)).tiles.map(({ id }) => id);
  assert.equal(new Set(ids).size, 12);
});

test('placed tiles and rack tiles are separate', () => {
  const game = startGame(puzzle, createRandom(1));
  game.tiles[0].slot = null;
  game.tiles[0].row = 3;
  game.tiles[0].col = 4;
  assert.deepEqual(placedTiles(game).map(({ id }) => id), [0]);
  assert.equal(rackTiles(game).length, 11);
});

test('every generated solution fits on the board', () => {
  const random = createRandom(11);
  for (let i = 0; i < 20; i++) {
    const { solution } = generatePuzzle(solvable, { random });
    assert.ok(solution.every(({ row, col }) => row < BOARD_SIZE && col < BOARD_SIZE));
  }
});
