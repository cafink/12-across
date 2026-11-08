// The game's state: the tiles and where each one is.

import { TILE_COUNT } from './rules.js';

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
