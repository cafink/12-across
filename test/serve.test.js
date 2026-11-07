import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from '../tools/serve.js';

const root = fileURLToPath(new URL('../site', import.meta.url));
let server;
let origin;

before(async () => {
  server = createStaticServer(root);
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('serves the game page at the root', async () => {
  const res = await fetch(`${origin}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/html/);
  assert.match(await res.text(), /<title>12 Across<\/title>/);
});

test('serves stylesheets with the right content type', async () => {
  const res = await fetch(`${origin}/css/style.css`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/css/);
});

test('returns 404 for a missing file', async () => {
  const res = await fetch(`${origin}/missing.html`);
  assert.equal(res.status, 404);
});

test('does not serve files outside the site folder', async () => {
  const res = await fetch(`${origin}/..%2fpackage.json`);
  assert.equal(res.status, 404);
});

test('rejects a malformed path', async () => {
  const res = await fetch(`${origin}/%E0%A4%A`);
  assert.equal(res.status, 400);
});
