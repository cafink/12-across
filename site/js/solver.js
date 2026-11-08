// Finds an arrangement of all 12 letters that makes a valid board.
//
// The search places a first word, then keeps adding words that cross the
// already-placed letters, starting with those that use the most new tiles.
// After each placement, every run it touches must still be valid, or the
// search backs up and tries something else.
//
// Because the board must be valid after every word placement, the search can't
// build solutions that only work once two are played in parallel, such as a
// 3 by 3 block.  Since it omits those solutions, "no solution found" doesn't
// demonstrate that there isn't one.  The generator just rolls again, so this
// just makes a puzzle a little more likely to be rerolled.

import { MIN_WORD_LENGTH, TILE_COUNT } from './rules.js';

export const DEFAULT_MAX_STEPS = 1500;

// Letters are handled as numbers from 0 to 25, and the board is a flat array of
// squares, big enough for any arrangement when the search starts in the middle.
// A word can stretch at most 12 squares from the first tile, and the extra
// margin keeps neighboring checks inside the array.
const ALPHABET_SIZE = 26;
const SIZE = 2 * TILE_COUNT + 4;
const ORIGIN = TILE_COUNT + 2;
const ACROSS = 1;
const DOWN = SIZE;
const EMPTY = -1;

const code = (letter) => letter.charCodeAt(0) - 97;
const letter = (value) => String.fromCharCode(value + 97);

// Counting the letters in every word is the slowest part of setting up, so
// it's done once per word list and reused for every roll.
const preparedLists = new WeakMap();

function prepare(words) {
  let prepared = preparedLists.get(words);
  if (!prepared) {
    const counts = new Uint8Array(words.length * ALPHABET_SIZE);
    words.forEach((word, index) => {
      for (let i = 0; i < word.length; i++) counts[index * ALPHABET_SIZE + code(word[i])]++;
    });
    prepared = { words, counts };
    preparedLists.set(words, prepared);
  }
  return prepared;
}

// Return the tiles for a solution, with rows and columns starting at 0, or null
// if none was found within `maxSteps` steps.  `words` is the list the solution
// may use, as an array.
export function solve(letters, words, { maxSteps = DEFAULT_MAX_STEPS } = {}) {
  const { counts } = prepare(words);
  const remaining = new Int8Array(ALPHABET_SIZE);
  for (const value of letters) remaining[code(value)]++;

  // Only words that can be spelled from the rolled letters can ever be used.
  const candidates = [];
  for (let index = 0; index < words.length; index++) {
    let fits = true;
    for (let value = 0; value < ALPHABET_SIZE; value++) {
      if (counts[index * ALPHABET_SIZE + value] > remaining[value]) {
        fits = false;
        break;
      }
    }
    if (fits) candidates.push(words[index]);
  }
  const allowed = new Set(candidates);

  // For each letter, every candidate word and its position as pairs of numbers,
  // so the search can find words that cross a letter.
  const containing = Array.from({ length: ALPHABET_SIZE }, () => []);
  candidates.forEach((word, index) => {
    for (let position = 0; position < word.length; position++) {
      containing[code(word[position])].push(index, position);
    }
  });

  const board = new Int8Array(SIZE * SIZE).fill(EMPTY);
  const placed = [];
  const seen = new Set();
  let tilesLeft = letters.length;
  let steps = 0;

  // A short code for the board's current shape + letters, so the search doesn't
  // explore the same board again after placing the same words in a different
  // order.
  function boardKey() {
    return placed.map((square) => square * ALPHABET_SIZE + board[square]).sort((a, b) => a - b).join(',');
  }

  function runIsValid(square, step) {
    let start = square;
    while (board[start - step] !== EMPTY) start -= step;
    let word = '';
    for (let at = start; board[at] !== EMPTY; at += step) word += letter(board[at]);
    return word.length === 1 || (word.length >= MIN_WORD_LENGTH && allowed.has(word));
  }

  function remove(added) {
    for (const square of added) {
      remaining[board[square]]++;
      board[square] = EMPTY;
    }
    placed.length -= added.length;
  }

  // Try to put `word` down from `start`.  Keep that placement and return the
  // filled squares, or return null & leave the board unchanged.
  function place(word, start, step) {
    const end = start + (word.length - 1) * step;
    if (board[start - step] !== EMPTY || board[end + step] !== EMPTY) return null;

    const added = [];
    let fits = true;
    for (let i = 0; i < word.length && fits; i++) {
      const square = start + i * step;
      const value = code(word[i]);
      if (board[square] === EMPTY) {
        if (remaining[value] === 0) {
          fits = false;
        } else {
          board[square] = value;
          remaining[value]--;
          added.push(square);
          placed.push(square);
        }
      } else if (board[square] !== value) {
        fits = false;
      }
    }

    const crossing = step === ACROSS ? DOWN : ACROSS;
    if (fits && added.length > 0 && added.every((square) => runIsValid(square, crossing))) return added;
    remove(added);
    return null;
  }

  // Every way to cross a letter already on the board with a candidate word,
  // sorted by the number of tiles it consumes.
  function nextPlacements() {
    const options = [];
    const tried = new Set();
    for (const square of placed) {
      const list = containing[board[square]];
      for (let i = 0; i < list.length; i += 2) {
        const index = list[i];
        const word = candidates[index];
        for (const step of [ACROSS, DOWN]) {
          const start = square - list[i + 1] * step;
          const id = (start * 2 + (step === ACROSS ? 0 : 1)) * candidates.length + index;
          if (tried.has(id)) continue;
          tried.add(id);
          let newTiles = 0;
          for (let j = 0; j < word.length; j++) {
            if (board[start + j * step] === EMPTY) newTiles++;
          }
          if (newTiles > 0 && newTiles <= tilesLeft) options.push({ word, start, step, newTiles });
        }
      }
    }
    return options.sort((a, b) => b.newTiles - a.newTiles);
  }

  function search() {
    if (tilesLeft === 0) return true;
    if (++steps > maxSteps) return false;
    const key = boardKey();
    if (seen.has(key)) return false;
    seen.add(key);

    for (const { word, start, step } of nextPlacements()) {
      const added = place(word, start, step);
      if (!added) continue;
      tilesLeft -= added.length;
      if (search()) return true;
      tilesLeft += added.length;
      remove(added);
      if (steps > maxSteps) return false;
    }
    return false;
  }

  const firstWords = [...candidates].sort((a, b) => b.length - a.length);
  const firstStart = ORIGIN * SIZE + ORIGIN;
  for (const word of firstWords) {
    const added = place(word, firstStart, ACROSS);
    if (!added) continue;
    tilesLeft -= added.length;
    if (search()) return toTiles(board, placed);
    tilesLeft += added.length;
    remove(added);
    if (steps > maxSteps) return null;
  }
  return null;
}

// Convert the search's squares into tiles.  The top row and the leftmost column
// are both 0.
function toTiles(board, placed) {
  const tiles = placed.map((square) => ({
    row: Math.floor(square / SIZE),
    col: square % SIZE,
    letter: letter(board[square]),
  }));
  const top = Math.min(...tiles.map((tile) => tile.row));
  const left = Math.min(...tiles.map((tile) => tile.col));
  return tiles
    .map((tile) => ({ ...tile, row: tile.row - top, col: tile.col - left }))
    .sort((a, b) => a.row - b.row || a.col - b.col);
}
