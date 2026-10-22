const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile, mkdir, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { serveAsset } = require('./assets.cjs');

test('desktop assets have correct MIME types and allow opaque runtime frames', async () => {
  const root = await mkdtemp(join(tmpdir(), 'procode-assets-'));
  try {
    await mkdir(join(root, 'runtime'));
    await writeFile(join(root, 'index.html'), '<h1>ProCode</h1>');
    await writeFile(join(root, 'runtime/test.wasm'), new Uint8Array([0, 97, 115, 109]));
    const response = await serveAsset(root, { url: 'procode://app/', method: 'GET' });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<h1>ProCode</h1>');
    const wasm = await serveAsset(root, { url: 'procode://app/runtime/test.wasm', method: 'GET' });
    assert.equal(wasm.headers.get('content-type'), 'application/wasm');
    assert.equal(wasm.headers.get('access-control-allow-origin'), '*');
    assert.equal(wasm.headers.get('x-content-type-options'), 'nosniff');
    const head = await serveAsset(root, { url: 'procode://app/', method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('desktop protocol cannot read outside the web bundle or accept writes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'procode-assets-'));
  try {
    for (const url of [
      'procode://other/',
      'file:///etc/passwd',
      'procode://app/%2e%2e%2fsecret',
      'procode://app/%2e%2e%5csecret',
      'procode://app/%00',
      'procode://app/%zz',
      'procode://user:pass@app/',
      'procode://app/missing.js',
    ]) {
      const response = await serveAsset(root, { url, method: 'GET' });
      assert.ok([403, 404].includes(response.status), url);
    }
    assert.equal((await serveAsset(root, { url: 'procode://app/', method: 'POST' })).status, 405);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
