import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRandom } from '../site/js/dice.js';
import {
  BOARD_SIZE,
  checkGame,
  RACK_SLOTS,
  moveTile,
  placedTiles,
  rackTiles,
  returnAllToRack,
  startGame,
} from '../site/js/game.js';
import { checkBoard } from '../site/js/rules.js';
import { generatePuzzle } from '../site/js/puzzle.js';
import { SOLVABLE_FILE } from '../site/js/word-files.js';

const solvable = readFileSync(new URL(`../site/words/${SOLVABLE_FILE}`, import.meta.url), 'utf8').trimEnd().split('\n');
const puzzle = { letters: [...'aabeiklmnrst'], solution: [] };
const findOpenSlot = (game) => [...Array(RACK_SLOTS).keys()].find((slot) => !rackTiles(game).some((tile) => tile.slot === slot));

// Put tiles on the board from a picture, taking each letter from the rack.  The
// optional offset moves the whole picture.  Every move must succeed.
function place(game, lines, rowOffset = 0, colOffset = 0) {
  lines.forEach((line, row) => [...line].forEach((letter, col) => {
    if (letter === '.') return;
    const tile = rackTiles(game).find((candidate) => candidate.letter === letter);
    const square = { row: row + rowOffset, col: col + colOffset };
    assert.equal(moveTile(game, tile.id, square), true, `couldn't place ${letter} at ${JSON.stringify(square)}`);
  }));
}

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

const at = (game, id) => {
  const { slot, row, col } = game.tiles.find((tile) => tile.id === id);
  return { slot, row, col };
};

test('a tile moves from the rack to the board and back', () => {
  const game = startGame(puzzle, createRandom(1));
  assert.equal(moveTile(game, 0, { row: 2, col: 3 }), true);
  assert.deepEqual(at(game, 0), { slot: null, row: 2, col: 3 });
  assert.equal(moveTile(game, 0, { slot: findOpenSlot(game) }), true);
  assert.equal(at(game, 0).row, null);
  assert.deepEqual(placedTiles(game), []);
});

test('a tile moves around the board and around the rack', () => {
  const game = startGame(puzzle, createRandom(1));
  moveTile(game, 0, { row: 0, col: 0 });
  assert.equal(moveTile(game, 0, { row: 5, col: 7 }), true);
  assert.deepEqual(at(game, 0), { slot: null, row: 5, col: 7 });
  const open = findOpenSlot(game);
  moveTile(game, 1, { row: 1, col: 1 });
  assert.equal(moveTile(game, 2, { slot: open }), true);
  assert.equal(at(game, 2).slot, open);
});

test('a tile dropped on a taken place stays where it was', () => {
  const game = startGame(puzzle, createRandom(1));
  moveTile(game, 0, { row: 4, col: 4 });
  moveTile(game, 1, { row: 4, col: 5 });
  assert.equal(moveTile(game, 1, { row: 4, col: 4 }), false);
  assert.deepEqual(at(game, 1), { slot: null, row: 4, col: 5 });
  const before = at(game, 2);
  assert.equal(moveTile(game, 2, { slot: at(game, 3).slot }), false);
  assert.deepEqual(at(game, 2), before);
});

test('a tile dropped on its own place stays where it was', () => {
  const game = startGame(puzzle, createRandom(1));
  assert.equal(moveTile(game, 0, { slot: at(game, 0).slot }), false);
});

test('tiles can go in the last row and column, but not past the edges', () => {
  const game = startGame(puzzle, createRandom(1));
  const last = BOARD_SIZE - 1;
  assert.equal(moveTile(game, 0, { row: last, col: last }), true);
  for (const place of [{ row: BOARD_SIZE, col: 0 }, { row: 0, col: BOARD_SIZE }, { row: -1, col: 0 }, { row: 0, col: -1 }]) {
    assert.equal(moveTile(game, 1, place), false, JSON.stringify(place));
  }
  for (const slot of [-1, RACK_SLOTS]) assert.equal(moveTile(game, 1, { slot }), false);
});

test('a solution against the bottom right corner of the board is solved', () => {
  // Another Q-less implementation missed wins with a tile in the last column.
  // This builds a real solution in the corner and checks it.
  const solution = ['.....t.', '....box', '.....g.', 'typical'];
  const game = startGame({ letters: [...'abcgilopttxy'], solution: [] }, createRandom(1));
  place(game, solution, BOARD_SIZE - solution.length, BOARD_SIZE - solution[0].length);
  const valid = new Set(['typical', 'toga', 'box']);
  assert.equal(checkBoard(placedTiles(game), (word) => valid.has(word)).solved, true);
});

test('returning all tiles fills empty slots in reading order', () => {
  const game = startGame(puzzle, createRandom(1));
  const ids = [3, 7, 9];
  [[2, 2], [0, 5], [2, 1]].forEach(([row, col], i) => moveTile(game, ids[i], { row, col }));
  const stayed = rackTiles(game).map((tile) => ({ ...tile }));
  const open = [...Array(RACK_SLOTS).keys()].filter((slot) => !stayed.some((tile) => tile.slot === slot));
  returnAllToRack(game);
  assert.deepEqual(placedTiles(game), []);
  for (const tile of stayed) assert.equal(at(game, tile.id).slot, tile.slot);
  assert.deepEqual([7, 9, 3].map((id) => at(game, id).slot), open);
});

const smallList = new Set(['typical', 'toga', 'box', 'cat']);
const inSmallList = (word) => smallList.has(word);
const letterOf = (game, id) => game.tiles.find((tile) => tile.id === id).letter;

test('tiles in a valid word light up', () => {
  const game = startGame({ letters: [...'abcgilopttxy'], solution: [] }, createRandom(1));
  place(game, ['typical']);
  const { solved, validTiles } = checkGame(game, inSmallList);
  assert.equal(solved, false);
  assert.deepEqual([...validTiles].map((id) => letterOf(game, id)).sort(), [...'acilpty']);
});

test('tiles only in invalid runs stay unlit', () => {
  const game = startGame({ letters: [...'abcgilopttxy'], solution: [] }, createRandom(1));
  place(game, ['typical', '......o']);
  const { validTiles } = checkGame(game, inSmallList);
  assert.equal([...validTiles].some((id) => letterOf(game, id) === 'o'), false);
  assert.equal(validTiles.size, 7);
});

test('a tile in one valid word stays lit even if it is also in an invalid run', () => {
  const game = startGame({ letters: [...'abcgilopttxy'], solution: [] }, createRandom(1));
  place(game, ['typical', '......o']);
  const l = game.tiles.find((tile) => tile.letter === 'l');
  assert.ok(checkGame(game, inSmallList).validTiles.has(l.id));
});

test('a complete board of valid words is solved, with every tile lit', () => {
  const game = startGame({ letters: [...'abcgilopttxy'], solution: [] }, createRandom(1));
  place(game, ['.....t.', '....box', '.....g.', 'typical']);
  const { solved, validTiles } = checkGame(game, inSmallList);
  assert.equal(solved, true);
  assert.equal(validTiles.size, 12);
});

test('an empty board has nothing lit and is not solved', () => {
  const { solved, validTiles } = checkGame(startGame(puzzle, createRandom(1)), inSmallList);
  assert.equal(solved, false);
  assert.equal(validTiles.size, 0);
});
