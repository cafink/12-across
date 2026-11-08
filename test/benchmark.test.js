import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../tools/benchmark.js', import.meta.url));

// The benchmark is only run now and then, so this checks that it still works
// at all.  It doesn't check the numbers, which depend on the machine.
test('the benchmark runs and finds no bad solutions', () => {
  const output = execFileSync(process.execPath, [script, '3'], { encoding: 'utf8' });
  assert.match(output, /Dice: 3 rolls/);
  assert.match(output, /Any letters: 1 rolls/);
  assert.equal(output.match(/Failed the rules check: +0$/gm)?.length, 2);
});
