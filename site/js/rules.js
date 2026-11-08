// The rules for checking a board.  A board is a list of tiles, each with a row,
// a column and a lowercase letter.  Rows and columns can be any whole numbers,
// because the size of the grid is not part of the rules.

// A puzzle has 12 tiles, which also makes 12 letters the longest possible word.
export const TILE_COUNT = 12;
export const MIN_WORD_LENGTH = 3;

function key(row, col) {
  return `${row},${col}`;
}

function letterMap(tiles) {
  const letters = new Map();
  for (const { row, col, letter } of tiles) {
    const position = key(row, col);
    if (letters.has(position)) throw new Error(`Two tiles at row ${row}, column ${col}`);
    letters.set(position, letter);
  }
  return letters;
}

// Find every run of two or more letters, across and down.  Each run gives its
// word, the row and column of its first letter, and its direction.  Runs come
// back in reading order: top to bottom, then left to right, with across before
// down.  A run of only two letters is not a valid play, but it's still returned
// so the page can show it as a problem.
export function findWords(tiles) {
  const letters = letterMap(tiles);
  const words = [];
  const starts = [...tiles].sort((a, b) => a.row - b.row || a.col - b.col);

  for (const { row, col } of starts) {
    for (const [direction, rowStep, colStep] of [['across', 0, 1], ['down', 1, 0]]) {
      if (letters.has(key(row - rowStep, col - colStep))) continue;
      let word = '';
      for (let r = row, c = col; letters.has(key(r, c)); r += rowStep, c += colStep) {
        word += letters.get(key(r, c));
      }
      if (word.length > 1) words.push({ word, row, col, direction });
    }
  }
  return words;
}

// Whether every tile can reach every other one through tiles directly above,
// below, left or right of each other.
export function isConnected(tiles) {
  if (tiles.length === 0) return true;
  const letters = letterMap(tiles);
  const seen = new Set([key(tiles[0].row, tiles[0].col)]);
  const waiting = [[tiles[0].row, tiles[0].col]];

  while (waiting.length > 0) {
    const [row, col] = waiting.pop();
    for (const [r, c] of [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]) {
      const position = key(r, c);
      if (letters.has(position) && !seen.has(position)) {
        seen.add(position);
        waiting.push([r, c]);
      }
    }
  }
  return seen.size === letters.size;
}

// Check a board.  `isWord` is a function that says whether a word is in the
// validation list.  Each word found gets a `valid` flag, and `solved` is true
// only when all 12 tiles are on the board, connected, and every run is a valid
// word of at least 3 letters.
export function checkBoard(tiles, isWord) {
  const words = findWords(tiles).map((found) => ({
    ...found,
    valid: found.word.length >= MIN_WORD_LENGTH && isWord(found.word),
  }));
  const connected = isConnected(tiles);
  const solved = tiles.length === TILE_COUNT && connected && words.every((found) => found.valid);
  return { words, connected, solved };
}
