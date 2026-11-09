// The game's state: the tiles and where each one is.

import { TILE_COUNT, checkBoard } from './rules.js';

// Just big enough for any solution.
export const BOARD_SIZE = TILE_COUNT;
export const RACK_SLOTS = TILE_COUNT;

// Fisher-Yates shuffle for the tile rack.
function shuffle(items, random) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Start a game from a puzzle, with the tiles shuffled into the rack.  `random`
// is a function like `Math.random`.  Each tile has an ID, so the page can tell
// same-letter tiles apart.  A tile in the rack has a `slot`, and one on the
// board has a `row` & `col`.
export function startGame(puzzle, random = Math.random) {
  const slots = shuffle([...Array(RACK_SLOTS).keys()], random);
  return {
    puzzle,
    tiles: puzzle.letters.map((letter, id) => ({ id, letter, slot: slots[id], row: null, col: null })),
  };
}

// Return board tiles to be passed to `checkBoard` in rules.js.
export function placedTiles(game) {
  return game.tiles.filter((tile) => tile.row !== null);
}

export function rackTiles(game) {
  return game.tiles.filter((tile) => tile.slot !== null);
}

export function isOnBoard(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function isTaken(game, place) {
  return game.tiles.some((tile) =>
    'slot' in place ? tile.slot === place.slot : tile.row === place.row && tile.col === place.col);
}

// Move a tile to a place: either `{ row, col }` on the board or `{ slot }` in
// the rack.  Return whether it moved.  It doesn't move if the place is
// occupied (even by the same tile), or if it isn't on the board or rack.
export function moveTile(game, id, place) {
  const valid = 'slot' in place
    ? Number.isInteger(place.slot) && place.slot >= 0 && place.slot < RACK_SLOTS
    : Number.isInteger(place.row) && Number.isInteger(place.col) && isOnBoard(place.row, place.col);
  if (!valid || isTaken(game, place)) return false;

  const tile = game.tiles.find((candidate) => candidate.id === id);
  tile.slot = place.slot ?? null;
  tile.row = place.row ?? null;
  tile.col = place.col ?? null;
  return true;
}

export function returnAllToRack(game) {
  const taken = new Set(rackTiles(game).map((tile) => tile.slot));
  const openSlots = [...Array(RACK_SLOTS).keys()].filter((slot) => !taken.has(slot));
  const onBoard = placedTiles(game).sort((a, b) => a.row - b.row || a.col - b.col);
  onBoard.forEach((tile, i) => moveTile(game, tile.id, { slot: openSlots[i] }));
}

// Check the board with `isWord`, a function that returns whether a word is
// valid.  Return whether the game is solved, and the IDs of tiles that are part
// of at least one valid word, so they can be highlighted.
export function checkGame(game, isWord) {
  const tiles = placedTiles(game);
  const { words, solved } = checkBoard(tiles, isWord);
  const idAt = new Map(tiles.map((tile) => [`${tile.row},${tile.col}`, tile.id]));
  const validTiles = new Set();
  for (const { word, row, col, direction, valid } of words) {
    if (!valid) continue;
    for (let i = 0; i < word.length; i++) {
      const key = direction === 'down' ? `${row + i},${col}` : `${row},${col + i}`;
      validTiles.add(idAt.get(key));
    }
  }
  return { solved, validTiles };
}
