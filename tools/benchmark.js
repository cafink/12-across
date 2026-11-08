// Measures how puzzle generation performs with the real solvability list.
// Usage: node tools/benchmark.js [number of rolls]
import { readFileSync } from 'node:fs';
import { createRandom, rollAnyLetters, rollDice } from '../site/js/dice.js';
import { checkBoard } from '../site/js/rules.js';
import { DEFAULT_MAX_STEPS, solve } from '../site/js/solver.js';
import { SOLVABLE_FILE } from '../site/js/word-files.js';

const count = Number(process.argv[2] ?? 1000);
const words = readFileSync(new URL(`../site/words/${SOLVABLE_FILE}`, import.meta.url), 'utf8').trimEnd().split('\n');
const allowed = new Set(words);
const vowelCount = (letters) => letters.filter((value) => 'aeiou'.includes(value)).length;
const percent = (part, whole) => `${((100 * part) / whole).toFixed(1)}%`;
const ms = (value) => `${value.toFixed(1)} ms`;
const line = (label, value) => console.log(`  ${`${label}:`.padEnd(26)}${value}`);

function run(name, roll, rolls) {
  const random = createRandom(1);
  // Warm up first, so the measurements don't include JavaScript optimizing the
  // code.
  for (let i = 0; i < Math.min(20, rolls); i++) solve(roll(random), words);

  let solved = 0;
  let wrong = 0;
  let totalTime = 0;
  const times = [];
  const vowels = {};
  for (let i = 0; i < rolls; i++) {
    const letters = roll(random);
    const start = performance.now();
    const tiles = solve(letters, words);
    const time = performance.now() - start;
    totalTime += time;
    if (!tiles) continue;
    solved++;
    times.push(time);
    vowels[vowelCount(letters)] = (vowels[vowelCount(letters)] ?? 0) + 1;
    const sameLetters = tiles.map((tile) => tile.letter).sort().join('') === letters.join('');
    if (!sameLetters || !checkBoard(tiles, (word) => allowed.has(word)).solved) wrong++;
  }
  times.sort((a, b) => a - b);

  console.log(`\n${name}: ${rolls} rolls, step limit ${DEFAULT_MAX_STEPS}`);
  line('Pass the fairness check', percent(solved, rolls));
  line('Failed the rules check', wrong);
  if (solved === 0) {
    console.log('  No rolls were solved.');
    return;
  }
  line('Typical solve', ms(times[Math.floor(times.length / 2)]));
  line('Slowest 5% of solves', `over ${ms(times[Math.floor(times.length * 0.95)])}`);
  line('Average time per puzzle', `${ms(totalTime / solved)}, including rerolls`);
  for (const [number, puzzles] of Object.entries(vowels)) {
    line(`Puzzles with ${number} vowels`, percent(puzzles, solved));
  }
}

run('Dice', rollDice, count);
run('Any letters', rollAnyLetters, Math.ceil(count / 3));
