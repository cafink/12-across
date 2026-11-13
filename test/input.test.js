import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRAG_DISTANCE, isDrag, isInside, nearestBox, tap } from '../site/js/input.js';

const square = { row: 2, col: 3 };
const slot = { slot: 4 };

test('tapping a tile selects it', () => {
  assert.deepEqual(tap(null, { tile: 5 }), { selected: 5, move: null });
});

test('tapping the selected tile deselects it', () => {
  assert.deepEqual(tap(5, { tile: 5 }), { selected: null, move: null });
});

test('tapping another tile switches the selection, and nothing moves', () => {
  assert.deepEqual(tap(5, { tile: 8 }), { selected: 8, move: null });
});

test('tapping an empty square or slot moves the selected tile there', () => {
  assert.deepEqual(tap(5, { place: square }), { selected: null, move: { id: 5, place: square } });
  assert.deepEqual(tap(5, { place: slot }), { selected: null, move: { id: 5, place: slot } });
});

test('tapping a square or slot with nothing selected does nothing', () => {
  assert.deepEqual(tap(null, { place: square }), { selected: null, move: null });
});

test('tapping anywhere else deselects', () => {
  assert.deepEqual(tap(5, {}), { selected: null, move: null });
  assert.deepEqual(tap(null, {}), { selected: null, move: null });
});

test('tile 0 can be selected, deselected and moved like any other', () => {
  assert.deepEqual(tap(null, { tile: 0 }), { selected: 0, move: null });
  assert.deepEqual(tap(0, { tile: 0 }), { selected: null, move: null });
  assert.deepEqual(tap(0, { place: square }), { selected: null, move: { id: 0, place: square } });
});

test('a small wobble is a tap, and a longer move is a drag', () => {
  assert.equal(isDrag(0, 0), false);
  assert.equal(isDrag(3, 2), false);
  assert.equal(isDrag(DRAG_DISTANCE - 0.1, 0), false);
  assert.equal(isDrag(DRAG_DISTANCE, 0), true);
  assert.equal(isDrag(0, -DRAG_DISTANCE), true);
  assert.equal(isDrag(5, 5), true);
});

// A row of three 10px boxes with 2px gaps, inside an area with 4px of padding,
// like a strip of board squares or rack slots.
const area = { left: 0, top: 0, right: 42, bottom: 18 };
const boxes = [0, 1, 2].map((i) => ({ left: 4 + 12 * i, top: 4, right: 14 + 12 * i, bottom: 14 }));

test('a point inside a box is inside it, and its edges count on the top and left only', () => {
  assert.equal(isInside(4, 4, boxes[0]), true);
  assert.equal(isInside(13.9, 13.9, boxes[0]), true);
  assert.equal(isInside(14, 9, boxes[0]), false);
  assert.equal(isInside(9, 14, boxes[0]), false);
});

test('a point inside a box picks that box', () => {
  assert.equal(nearestBox(9, 9, area, boxes), 0);
  assert.equal(nearestBox(21, 9, area, boxes), 1);
});

test('a point in the gap between boxes picks the nearer one', () => {
  assert.equal(nearestBox(14.5, 9, area, boxes), 0);
  assert.equal(nearestBox(15.5, 9, area, boxes), 1);
});

test('a point in the padding picks the nearest box', () => {
  assert.equal(nearestBox(21, 1, area, boxes), 1);
  assert.equal(nearestBox(1, 17, area, boxes), 0);
});

test('a point outside the area picks nothing', () => {
  assert.equal(nearestBox(21, -1, area, boxes), null);
  assert.equal(nearestBox(42, 9, area, boxes), null);
});

test('with no boxes, nothing is picked', () => {
  assert.equal(nearestBox(9, 9, area, []), null);
});
