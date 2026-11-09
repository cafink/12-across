// Draw the game on the page and handle dragging + the buttons.  The game
// logic lives in the other modules, so this file only deals with the page.

import { BOARD_SIZE, RACK_SLOTS, moveTile, placedTiles, rackTiles, returnAllToRack, startGame } from './game.js';
import { generatePuzzle } from './puzzle.js';
import { SOLVABLE_FILE } from './word-files.js';

const board = document.querySelector('#board');
const rack = document.querySelector('#rack');
const status = document.querySelector('#status');
const newGameButton = document.querySelector('#new-game');
const clearButton = document.querySelector('#clear-board');

let solvableWords;
let game;

// The tile being dragged, if any.
let drag = null;

async function loadWords(file) {
  const response = await fetch(`words/${file}`);
  if (!response.ok) throw new Error(`Couldn't load ${file}: ${response.status}`);
  return (await response.text()).trimEnd().split('\n');
}

function tileElement(tile) {
  const element = document.createElement('div');
  element.className = 'tile';
  element.textContent = tile.letter;
  element.dataset.id = tile.id;
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
  const squares = emptyElements(BOARD_SIZE * BOARD_SIZE, 'square');
  squares.forEach((square, i) => {
    square.dataset.row = Math.floor(i / BOARD_SIZE);
    square.dataset.col = i % BOARD_SIZE;
  });
  for (const tile of placedTiles(game)) {
    squares[tile.row * BOARD_SIZE + tile.col].append(tileElement(tile));
  }
  board.replaceChildren(...squares);

  const slots = emptyElements(RACK_SLOTS, 'slot');
  slots.forEach((slot, i) => {
    slot.dataset.slot = i;
  });
  for (const tile of rackTiles(game)) slots[tile.slot].append(tileElement(tile));
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

function startDrag(event) {
  const element = event.target.closest('.tile');
  if (!element || event.button !== 0 || drag) return;
  event.preventDefault();
  element.setPointerCapture(event.pointerId);
  element.classList.add('dragging');
  drag = { id: Number(element.dataset.id), element, x: event.clientX, y: event.clientY };
}

function continueDrag(event) {
  if (!drag) return;
  drag.element.style.transform = `translate(${event.clientX - drag.x}px, ${event.clientY - drag.y}px)`;
}

// Drop the tile on whatever square/slot is under the pointer.  (The dragged
// tile is hidden so it won't be what's found under the pointer.)
function endDrag(event) {
  if (!drag) return;
  const { id, element } = drag;
  drag = null;
  element.style.visibility = 'hidden';
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.square, .slot');
  if (target) {
    moveTo(id, target);
  } else {
    render();
  }
}

function cancelDrag() {
  if (!drag) return;
  drag = null;
  render();
}

function newGame() {
  game = startGame(generatePuzzle(solvableWords));
  render();
}

function clearBoard() {
  returnAllToRack(game);
  render();
}

async function start() {
  board.style.setProperty('--board-size', BOARD_SIZE);
  try {
    solvableWords = await loadWords(SOLVABLE_FILE);
  } catch (error) {
    status.textContent = 'Sorry, the word list didn’t load.  Try reloading the page.';
    throw error;
  }
  status.textContent = '';
  for (const button of [newGameButton, clearButton]) button.disabled = false;
  newGameButton.addEventListener('click', newGame);
  clearButton.addEventListener('click', clearBoard);
  document.addEventListener('pointerdown', startDrag);
  document.addEventListener('pointermove', continueDrag);
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', cancelDrag);
  newGame();
}

start();
