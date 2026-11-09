import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRAG_DISTANCE, isDrag, tap } from '../site/js/input.js';

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
