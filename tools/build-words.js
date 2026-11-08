// Builds the word lists in site/words/ from the sources in data/.
//
// The solvability list holds ordinary words.  The solver uses it to guarantee
// that every puzzle has a "fair" solution.  The validation list determines
// whichnwords a player can use, so it's much larger.  Every solvability word
// must also be a validation word.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIN_WORD_LENGTH, TILE_COUNT } from '../site/js/rules.js';
import { SOLVABLE_FILE, VALID_FILE } from '../site/js/word-files.js';

// How much of SCOWL goes into each list.  SCOWL groups words into size levels
// by how common they are--lower numbers are more common.
const SOLVABLE_MAX_SIZE = 35;
const VALID_MAX_SIZE = 60;
const WORD = new RegExp(`^[a-z]{${MIN_WORD_LENGTH},${TILE_COUNT}}$`);

export const NOTICE_FILE = 'SCOWL-COPYRIGHT.txt';

// The source lists are ISO-8859-1.  Anything that isn't a plain lowercase word
// is skipped, which also drops proper nouns and possessives.
function readSourceWords(path) {
  return readFileSync(path, 'latin1')
    .split(/\r?\n/)
    .filter((line) => WORD.test(line));
}

function readScowl(dir, maxSize) {
  const words = new Set();
  for (const name of readdirSync(dir)) {
    const match = name.match(/^(?:english|american)-words\.(\d+)$/);
    if (match && Number(match[1]) <= maxSize) {
      for (const word of readSourceWords(join(dir, name))) words.add(word);
    }
  }
  return words;
}

// Hand-kept files allow blank lines and # comments, and anything else that
// isn't a word is treated as a mistake.
function readHandKeptWords(path) {
  const words = [];
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (line === '' || line.startsWith('#')) continue;
    if (!WORD.test(line)) throw new Error(`Invalid word in ${path}: "${line}"`);
    words.push(line);
  }
  return words;
}

export function buildWordLists(root) {
  const data = join(root, 'data');
  const scowlDir = join(data, 'sources', 'scowl');

  const enable = new Set(readSourceWords(join(data, 'sources', 'enable1.txt')));
  const excluded = new Set(readHandKeptWords(join(data, 'solver-exclusions.txt')));
  const extras = readHandKeptWords(join(data, 'extras.txt'));

  const solvable = [...readScowl(scowlDir, SOLVABLE_MAX_SIZE)]
    .filter((word) => enable.has(word) && !excluded.has(word))
    .sort();
  const validSet = new Set([...enable, ...readScowl(scowlDir, VALID_MAX_SIZE), ...extras]);

  for (const word of solvable) {
    if (!validSet.has(word)) throw new Error(`Solvable word isn't valid: "${word}"`);
  }

  return { solvable, valid: [...validSet].sort() };
}

function writeWordList(path, words) {
  writeFileSync(path, `${words.join('\n')}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const out = join(root, 'site', 'words');
  const { solvable, valid } = buildWordLists(root);

  mkdirSync(out, { recursive: true });
  writeWordList(join(out, SOLVABLE_FILE), solvable);
  writeWordList(join(out, VALID_FILE), valid);
  copyFileSync(join(root, 'data', 'sources', 'scowl', 'Copyright'), join(out, NOTICE_FILE));

  console.log(`${SOLVABLE_FILE}: ${solvable.length} words`);
  console.log(`${VALID_FILE}: ${valid.length} words`);
}
