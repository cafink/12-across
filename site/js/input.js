// Decide what the player's pointer actions mean, independent of the page/DOM.

// How far (in pixels) the pointer must move before a press counts as a drag.
export const DRAG_DISTANCE = 6;

// Return whether a press that has moved this far is a drag.
export function isDrag(dx, dy) {
  return Math.hypot(dx, dy) >= DRAG_DISTANCE;
}

// Decide what a tap does.  `selected` is the selected tile's id, or null.
// `tapped` describes what was tapped: `{ tile: id }` for a tile, `{ place }`
// for an empty square or slot, or `{}` for anything else.  Return the new
// selection, and the move to make (if any) as `{ id, place }`.
export function tap(selected, tapped) {
  if ('tile' in tapped) {
    return { selected: tapped.tile === selected ? null : tapped.tile, move: null };
  }
  if (selected !== null && 'place' in tapped) {
    return { selected: null, move: { id: selected, place: tapped.place } };
  }
  return { selected: null, move: null };
}
