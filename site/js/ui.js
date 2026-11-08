// Draw the game on the page and handle the buttons.  The game logic lives in
// the other modules, so this file only deals with the page.

import { BOARD_SIZE, RACK_SLOTS, placedTiles, rackTiles, startGame } from './game.js';
import { generatePuzzle } from './puzzle.js';
import { SOLVABLE_FILE } from './word-files.js';

const board = document.querySelector('#board');
const rack = document.querySelector('#rack');
const status = document.querySelector('#status');
const newGameButton = document.querySelector('#new-game');

let solvableWords;
let game;

async function loadWords(file) {
  const response = await fetch(`words/${file}`);
  if (!response.ok) throw new Error(`Couldn't load ${file}: ${response.status}`);
  return (await response.text()).trimEnd().split('\n');
}

function tileElement(tile) {
  const element = document.createElement('div');
  element.className = 'tile';
  element.textContent = tile.letter;
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
  for (const tile of placedTiles(game)) {
    squares[tile.row * BOARD_SIZE + tile.col].append(tileElement(tile));
  }
  board.replaceChildren(...squares);

  const slots = emptyElements(RACK_SLOTS, 'slot');
  for (const tile of rackTiles(game)) slots[tile.slot].append(tileElement(tile));
  rack.replaceChildren(...slots);
}

function newGame() {
  game = startGame(generatePuzzle(solvableWords));
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
  newGameButton.disabled = false;
  newGameButton.addEventListener('click', newGame);
  newGame();
}

start();
