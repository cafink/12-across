// Draw the game on the page and handle dragging, tapping and buttons.  The game
// logic lives in the other modules, so this file only deals with the page.

import {
  BOARD_SIZE,
  RACK_SLOTS,
  checkGame,
  moveTile,
  placedTiles,
  rackTiles,
  returnAllToRack,
  startGame,
} from './game.js';
import { isDrag, tap } from './input.js';
import { generatePuzzle } from './puzzle.js';
import { SOLVABLE_FILE, VALID_FILE } from './word-files.js';

const board = document.querySelector('#board');
const rack = document.querySelector('#rack');
const status = document.querySelector('#status');
const message = document.querySelector('#message');
const newGameButton = document.querySelector('#new-game');
const clearButton = document.querySelector('#clear-board');

let solvableWords;
let game;

// The validation list is null until it's loaded.  Words aren't checked until
// then.
let validWords = null;

// Whether the validation list failed to load, so its error message isn't
// cleared when the other list finishes loading.
let validWordsFailed = false;

// The tile being pressed and whether that press has become a drag.
let press = null;

// A tapped tile, waiting for a subsequent tap to tell it where it should go.
let selected = null;

async function loadWords(file) {
  const response = await fetch(`words/${file}`);
  if (!response.ok) throw new Error(`Couldn't load ${file}: ${response.status}`);
  return (await response.text()).trimEnd().split('\n');
}

function tileElement(tile, validTiles) {
  const element = document.createElement('div');
  element.className = 'tile';
  element.textContent = tile.letter;
  element.dataset.id = tile.id;
  if (tile.id === selected) element.classList.add('selected');
  if (validTiles.has(tile.id)) element.classList.add('valid');
  return element;
}

// Return a list of empty elements, each with the given class name.
function emptyElements(count, className) {
  return Array.from({ length: count }, () => {
    const element = document.createElement('div');
    element.className = className;
    return element;
  });
}

function render() {
  const { solved, validTiles } = validWords
    ? checkGame(game, (word) => validWords.has(word))
    : { solved: false, validTiles: new Set() };
  message.textContent = solved ? 'Solved!  Nice work.' : '';

  const squares = emptyElements(BOARD_SIZE * BOARD_SIZE, 'square');
  squares.forEach((square, i) => {
    square.dataset.row = Math.floor(i / BOARD_SIZE);
    square.dataset.col = i % BOARD_SIZE;
  });
  for (const tile of placedTiles(game)) {
    squares[tile.row * BOARD_SIZE + tile.col].append(tileElement(tile, validTiles));
  }
  board.replaceChildren(...squares);

  const slots = emptyElements(RACK_SLOTS, 'slot');
  slots.forEach((slot, i) => {
    slot.dataset.slot = i;
  });
  for (const tile of rackTiles(game)) slots[tile.slot].append(tileElement(tile, validTiles));
  rack.replaceChildren(...slots);
}

// The place a square or slot element stands for.
function placeOf(element) {
  if (element.classList.contains('slot')) return { slot: Number(element.dataset.slot) };
  return { row: Number(element.dataset.row), col: Number(element.dataset.col) };
}

// Move a tile & redraw.  If the place is taken, the tile stays where it was.
function moveTo(id, element) {
  moveTile(game, id, placeOf(element));
  render();
}

function startPress(event) {
  const element = event.target.closest('.tile');
  if (!element || event.button !== 0 || press) return;
  event.preventDefault();
  element.setPointerCapture(event.pointerId);
  press = { id: Number(element.dataset.id), element, x: event.clientX, y: event.clientY, moved: false };
}

function continuePress(event) {
  if (!press) return;
  const dx = event.clientX - press.x;
  const dy = event.clientY - press.y;
  if (!press.moved) {
    if (!isDrag(dx, dy)) return;
    press.moved = true;
    selected = null;
    press.element.classList.remove('selected');
    press.element.classList.add('dragging');
  }
  press.element.style.transform = `translate(${dx}px, ${dy}px)`;
}

// If the press never became a drag, it's a tap.  Otherwise, drop the tile on
// whatever square/slot is under the pointer.  (The dragged tile is hidden so it
// won't be what's found under the pointer.)
function endPress(event) {
  if (!press) return;
  const { id, element, moved } = press;
  press = null;
  if (!moved) {
    applyTap({ tile: id });
    return;
  }
  element.style.visibility = 'hidden';
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.square, .slot');
  if (target) {
    moveTo(id, target);
  } else {
    render();
  }
}

// Carry out a tap as decided by `tap` in input.js, then redraw.
function applyTap(tapped) {
  const result = tap(selected, tapped);
  selected = result.selected;
  if (result.move) moveTile(game, result.move.id, result.move.place);
  render();
}

// Work out what a click/tap landed on, besides a tile or button.  Tiles are
// handled by the press code, and buttons have their own handlers.
function tapPlace(event) {
  if (event.target.closest('.tile, button')) return;
  const place = event.target.closest('.square, .slot');
  applyTap(place ? { place: placeOf(place) } : {});
}

function cancelPress() {
  if (!press) return;
  press = null;
  render();
}

function newGame() {
  selected = null;
  game = startGame(generatePuzzle(solvableWords));
  render();
}

function clearBoard() {
  selected = null;
  returnAllToRack(game);
  render();
}

// Load the validation list after the game has started, so the game can start
// without waiting for it.  Valid words light up once it loads.
async function loadValidWords() {
  try {
    validWords = new Set(await loadWords(VALID_FILE));
  } catch (error) {
    validWordsFailed = true;
    status.textContent = 'Sorry, words can\u2019t be checked, because the word list didn\u2019t load.  Try reloading the page.';
    throw error;
  }
  render();
}

async function start() {
  board.style.setProperty('--board-size', BOARD_SIZE);
  const validLoad = loadValidWords();
  try {
    solvableWords = await loadWords(SOLVABLE_FILE);
  } catch (error) {
    status.textContent = 'Sorry, the word list didn’t load.  Try reloading the page.';
    throw error;
  }
  if (!validWordsFailed) status.textContent = '';
  for (const button of [newGameButton, clearButton]) button.disabled = false;
  newGameButton.addEventListener('click', newGame);
  clearButton.addEventListener('click', clearBoard);
  document.addEventListener('pointerdown', startPress);
  document.addEventListener('pointermove', continuePress);
  document.addEventListener('pointerup', endPress);
  document.addEventListener('pointercancel', cancelPress);
  document.addEventListener('click', tapPlace);
  newGame();
  await validLoad;
}

start();
