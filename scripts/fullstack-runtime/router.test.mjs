import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from './router.mjs';

test('dispatches methods, decoded string parameters, query and body without business logic', async () => {
  const db = { count: 0 },
    router = createRouter();
  router.patch('/items/:id', async (r, state) => {
    assert.equal(r.params.id, 'a b');
    assert.deepEqual(r.query.getAll('tag'), ['one', 'two']);
    assert.deepEqual(r.body, { value: 7 });
    assert.equal(state, db);
    return { status: 202, body: r.body };
  });
  assert.deepEqual(
    await router.handle(
      { method: 'patch', path: '/items/a%20b?tag=one&tag=two', body: { value: 7 } },
      db,
    ),
    { status: 202, body: { value: 7 } },
  );
  assert.deepEqual(db, { count: 0 });
});
test('unmatched methods and incomplete paths return 404; malformed escapes return 400', async () => {
  const router = createRouter().get('/items/:id', () => ({ status: 200, body: null }));
  for (const request of [
    { method: 'POST', path: '/items/1' },
    { method: 'GET', path: '/items/' },
    { method: 'GET', path: '/items/1/extra' },
    { method: 'GET', path: '/missing' },
  ])
    assert.equal((await router.handle(request, {})).status, 404);
  assert.equal((await router.handle({ method: 'GET', path: '/items/%xx' }, {})).status, 400);
});
test('keeps parameters isolated and lets handler failures reach diagnostics', async () => {
  const router = createRouter().get('/items/:constructor', (r) => {
    assert.equal(Object.getPrototypeOf(r.params), null);
    assert.equal(r.params.constructor, '1');
    throw Error('learner failure');
  });
  await assert.rejects(router.handle({ method: 'GET', path: '/items/1' }, {}), /learner failure/);
  assert.throws(() => router.get('missing slash', () => {}), /Register a route/);
});
test('router survives serialization into the worker with no outer dependencies', async () => {
  const factory = new Function(`return (${createRouter.toString()});`)();
  const router = factory().get('/ping', () => ({ status: 200, body: 'pong' }));
  assert.deepEqual(await router.handle({ method: 'GET', path: '/ping' }, {}), {
    status: 200,
    body: 'pong',
  });
});
