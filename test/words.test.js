import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SOLVABLE_FILE, VALID_FILE } from '../site/js/word-files.js';
import { NOTICE_FILE, buildWordLists } from '../tools/build-words.js';

const root = fileURLToPath(new URL('..', import.meta.url));

function readList(name) {
  return readFileSync(`${root}site/words/${name}`, 'utf8').trimEnd().split('\n');
}

function readHandKept(name) {
  return readFileSync(`${root}data/${name}`, 'utf8')
    .split('\n')
    .filter((line) => line !== '' && !line.startsWith('#'));
}

const solvable = readList(SOLVABLE_FILE);
const valid = readList(VALID_FILE);
const solvableSet = new Set(solvable);
const validSet = new Set(valid);

for (const [name, words] of [['solvability', solvable], ['validation', valid]]) {
  test(`the ${name} list contains only lowercase words of 3 to 12 letters`, () => {
    assert.deepEqual(words.filter((word) => !/^[a-z]{3,12}$/.test(word)), []);
  });

  test(`the ${name} list is sorted with no duplicates`, () => {
    assert.deepEqual(words, [...new Set(words)].sort());
  });
}

test('every solvability word is a validation word', () => {
  assert.deepEqual(solvable.filter((word) => !validSet.has(word)), []);
});

test('the committed lists match what the build produces', () => {
  const built = buildWordLists(root);
  assert.deepEqual(solvable, built.solvable);
  assert.deepEqual(valid, built.valid);
});

test('excluded words are kept off the solvability list but stay playable', () => {
  const excluded = readHandKept('solver-exclusions.txt');
  assert.deepEqual(excluded.filter((word) => solvableSet.has(word)), []);
  assert.deepEqual(excluded.filter((word) => !validSet.has(word)), []);
});

test('extra words are valid', () => {
  assert.deepEqual(readHandKept('extras.txt').filter((word) => !validSet.has(word)), []);
});

test('everyday words are on the solvability list', () => {
  const words = ['start', 'because', 'fever', 'scratch', 'cocktail', 'analysis', 'button'];
  assert.deepEqual(words.filter((word) => !solvableSet.has(word)), []);
});

test('modern and unusual words are valid', () => {
  const words = ['blog', 'inbox', 'malware', 'zen', 'app', 'aalii', 'zax'];
  assert.deepEqual(words.filter((word) => !validSet.has(word)), []);
});

test('the SCOWL notice is published unchanged', () => {
  const source = readFileSync(`${root}data/sources/scowl/Copyright`);
  const published = readFileSync(`${root}site/words/${NOTICE_FILE}`);
  assert.ok(source.equals(published));
});
