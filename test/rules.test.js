import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkBoard, findWords, isConnected } from '../site/js/rules.js';
import { VALID_FILE } from '../site/js/word-files.js';

// Build tiles from a picture of the board, where dots are empty squares.  The
// optional offset moves the whole picture, to check that position doesn't
// matter.
function board(lines, rowOffset = 0, colOffset = 0) {
  const tiles = [];
  lines.forEach((line, row) => {
    [...line].forEach((letter, col) => {
      if (letter !== '.') tiles.push({ row: row + rowOffset, col: col + colOffset, letter });
    });
  });
  return tiles;
}

const words = (tiles) => findWords(tiles).map(({ word, direction }) => `${word} ${direction}`);
const smallList = new Set(['cat', 'cot', 'toe', 'eat', 'tea', 'ode', 'dog']);
const inSmallList = (word) => smallList.has(word);

const validWords = new Set(readFileSync(new URL(`../site/words/${VALID_FILE}`, import.meta.url), 'utf8').split('\n'));
const isValid = (word) => validWords.has(word);

// TYPICAL, TOGA and BOX: 12 tiles, from one of the solver benchmark's
// solutions.
const SOLVED = [
  '.....t.',
  '....box',
  '.....g.',
  'typical',
];

test('an empty board has no words and is not solved', () => {
  assert.deepEqual(findWords([]), []);
  assert.equal(checkBoard([], inSmallList).solved, false);
});

test('finds a word across and a word down', () => {
  assert.deepEqual(words(board(['cat'])), ['cat across']);
  assert.deepEqual(words(board(['c', 'a', 't'])), ['cat down']);
});

test('finds both words where two words cross', () => {
  assert.deepEqual(words(board(['cat', '.o.', '.t.'])), ['cat across', 'aot down']);
});

test('reports where each word starts', () => {
  const [across, down] = findWords(board(['....', '.cat', '..o.', '..e.']));
  assert.deepEqual(across, { word: 'cat', row: 1, col: 1, direction: 'across' });
  assert.deepEqual(down, { word: 'aoe', row: 1, col: 2, direction: 'down' });
});

test("a letter on its own isn't counted as a run", () => {
  assert.deepEqual(findWords(board(['c'])), []);
});

test('a two-letter run is found but not valid', () => {
  const { words: found } = checkBoard(board(['at']), () => true);
  assert.deepEqual(found.map(({ word, valid }) => [word, valid]), [['at', false]]);
});

test('words not in the list are invalid', () => {
  const { words: found } = checkBoard(board(['cat', 'zzz']), inSmallList);
  assert.equal(found.find(({ word }) => word === 'cat').valid, true);
  assert.equal(found.find(({ word }) => word === 'zzz').valid, false);
});

test('side-by-side words create short runs that make the board invalid', () => {
  const result = checkBoard(board(['cat', 'ode']), inSmallList);
  assert.deepEqual(result.words.map(({ word }) => word).sort(), ['ad', 'cat', 'co', 'ode', 'te']);
  assert.ok(result.words.some(({ valid }) => !valid));
});

test('tiles touching on an edge are connected', () => {
  assert.equal(isConnected(board(['cat', '..o', '..e'])), true);
});

test('separate groups of tiles are not connected', () => {
  assert.equal(isConnected(board(['cat..', '.....', '..dog'])), false);
});

test('tiles touching only at a corner are not connected', () => {
  assert.equal(isConnected(board(['c.', '.a'])), false);
});

test('a complete, connected board of valid words is solved', () => {
  const result = checkBoard(board(SOLVED), isValid);
  assert.equal(board(SOLVED).length, 12);
  assert.deepEqual(result.words.map(({ word }) => word).sort(), ['box', 'toga', 'typical']);
  assert.equal(result.solved, true);
});

test('position on the board makes no difference', () => {
  for (const [rowOffset, colOffset] of [[0, 0], [0, 5], [100, 100], [-50, -7]]) {
    assert.equal(checkBoard(board(SOLVED, rowOffset, colOffset), isValid).solved, true);
  }
});

test('fewer than 12 tiles is not solved, even if every word is valid', () => {
  const result = checkBoard(board(['cat', '..o', '..e']), inSmallList);
  assert.equal(result.words.every(({ valid }) => valid), true);
  assert.equal(result.solved, false);
});

test('12 tiles with an invalid word is not solved', () => {
  const tiles = board(['.....t.', '....boz', '.....g.', 'typical']);
  assert.equal(checkBoard(tiles, isValid).solved, false);
});

test('12 tiles of valid words that are not connected is not solved', () => {
  const twelve = board(['cat.dog', '.......', 'toe.tea']);
  assert.equal(twelve.length, 12);
  const result = checkBoard(twelve, inSmallList);
  assert.equal(result.words.every(({ valid }) => valid), true);
  assert.equal(result.connected, false);
  assert.equal(result.solved, false);
});

test('two tiles in the same square are rejected', () => {
  const tiles = [{ row: 0, col: 0, letter: 'a' }, { row: 0, col: 0, letter: 'b' }];
  assert.throws(() => findWords(tiles), /Two tiles at row 0, column 0/);
});
