import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DICE,
  createRandom,
  rollAnyLetters,
  rollDice,
} from '../site/js/dice.js';

const VOWELS = new Set('aeiou');
const SEEDS = Array.from({ length: 2000 }, (_, i) => i);

// Whether each letter can be matched to a different die that has it as a face.
// This is a small bipartite matching: each letter claims a die, and a die that
// is already claimed can be handed over if its letter finds another die.
function fromSeparateDice(letters, dice) {
  const owner = new Array(dice.length).fill(-1);
  function claim(letterIndex, tried) {
    for (let die = 0; die < dice.length; die++) {
      if (tried.has(die) || !dice[die].includes(letters[letterIndex])) continue;
      tried.add(die);
      if (owner[die] === -1 || claim(owner[die], tried)) {
        owner[die] = letterIndex;
        return true;
      }
    }
    return false;
  }
  return letters.every((_, i) => claim(i, new Set()));
}

test('there are 12 dice with 6 lowercase faces each', () => {
  assert.equal(DICE.length, 12);
  for (const die of DICE) assert.match(die, /^[a-z]{6}$/);
});

test('the same seed always gives the same numbers', () => {
  const first = createRandom(42);
  const second = createRandom(42);
  for (let i = 0; i < 100; i++) assert.equal(first(), second());
});

test('random numbers are from 0 up to but not including 1', () => {
  const random = createRandom(7);
  for (let i = 0; i < 10000; i++) {
    const value = random();
    assert.ok(value >= 0 && value < 1, `out of range: ${value}`);
  }
});

test('a dice roll is 12 letters in alphabetical order', () => {
  for (const seed of SEEDS.slice(0, 100)) {
    const letters = rollDice(createRandom(seed));
    assert.equal(letters.length, 12);
    assert.deepEqual(letters, [...letters].sort());
  }
});

test('the same seed gives the same dice roll', () => {
  assert.deepEqual(rollDice(createRandom(1234)), rollDice(createRandom(1234)));
});

test('different seeds give different dice rolls', () => {
  const rolls = new Set(SEEDS.slice(0, 200).map((seed) => rollDice(createRandom(seed)).join('')));
  assert.ok(rolls.size > 190, `only ${rolls.size} different rolls`);
});

test('every letter in a dice roll comes from a different die', () => {
  for (const seed of SEEDS) {
    const letters = rollDice(createRandom(seed));
    assert.ok(fromSeparateDice(letters, DICE), `impossible roll: ${letters.join('')}`);
  }
});

test('the matching check rejects a roll the dice cannot make', () => {
  assert.equal(fromSeparateDice([...'aaaaaaaaaaaa'], DICE), false);
});

test('every dice roll has 2 or 3 vowels', () => {
  const counts = new Set();
  for (const seed of SEEDS) {
    const vowels = rollDice(createRandom(seed)).filter((letter) => VOWELS.has(letter)).length;
    assert.ok(vowels === 2 || vowels === 3, `${vowels} vowels`);
    counts.add(vowels);
  }
  assert.deepEqual([...counts].sort(), [2, 3]);
});

test('every face of every die eventually comes up', () => {
  const seen = new Set();
  for (const seed of SEEDS) {
    for (const letter of rollDice(createRandom(seed))) seen.add(letter);
  }
  assert.deepEqual([...seen].sort().join(''), [...new Set(DICE.join(''))].sort().join(''));
});

test('an any-letters roll is 12 letters in alphabetical order', () => {
  for (const seed of SEEDS.slice(0, 100)) {
    const letters = rollAnyLetters(createRandom(seed));
    assert.equal(letters.length, 12);
    for (const letter of letters) assert.match(letter, /^[a-z]$/);
    assert.deepEqual(letters, [...letters].sort());
  }
});

test('any-letters rolls eventually use the whole alphabet, including Q', () => {
  const seen = new Set();
  for (const seed of SEEDS) {
    for (const letter of rollAnyLetters(createRandom(seed))) seen.add(letter);
  }
  assert.equal(seen.size, 26);
});
