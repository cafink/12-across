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

// Is point (x, y) inside the given box?  Boxes are of the form `{ left, top,
// right, bottom }`, like `getBoundingClientRect`.
export function isInside(x, y, box) {
  return x >= box.left && x < box.right && y >= box.top && y < box.bottom;
}

// Return the index of the box nearest (x, y), or null if the point is outside
// of `area`.  Distance is to the box's edge, so a point inside of one has
// distance 0 from it.  This lets a dragged tile that lands in between spaces go
// to the nearer one.
export function nearestBox(x, y, area, boxes) {
  if (!isInside(x, y, area)) return null;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const [i, box] of boxes.entries()) {
    const distance = Math.hypot(
      Math.max(box.left - x, 0, x - box.right),
      Math.max(box.top - y, 0, y - box.bottom),
    );
    if (distance === 0) return i;
    if (distance < nearestDistance) {
      nearest = i;
      nearestDistance = distance;
    }
  }
  return nearest;
}
