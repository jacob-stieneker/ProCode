import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstValueFrom } from 'rxjs';
import { PracticeContactsApi } from './contacts-api.mjs';
const get = firstValueFrom;
test('CRUD records persist across list calls with server IDs and revisions', async () => {
  const api = new PracticeContactsApi();
  const created = await get(api.create({ name: ' Lin ', email: ' lin@example.com ' }));
  assert.deepEqual(created, { id: 3, name: 'Lin', email: 'lin@example.com', version: 1 });
  const updated = await get(api.update(3, { name: 'Lin Updated', email: 'new@example.com' }, 1));
  assert.equal(updated.version, 2);
  assert.equal((await get(api.list()))[2].name, 'Lin Updated');
  await get(api.delete(3, 2));
  assert.equal((await get(api.list())).length, 2);
  assert.equal((await get(api.create({ name: 'Next', email: 'next@example.com' }))).id, 4);
});
test('failed and invalid writes do not mutate records or consume IDs', async () => {
  const api = new PracticeContactsApi();
  api.failNext('create');
  await assert.rejects(
    get(api.create({ name: 'Lin', email: 'lin@example.com' })),
    (e) => e.code === 503,
  );
  await assert.rejects(get(api.create({ name: ' ', email: 'invalid' })), (e) => e.code === 400);
  assert.equal((await get(api.list())).length, 2);
  assert.equal((await get(api.create({ name: 'Lin', email: 'lin@example.com' }))).id, 3);
  api.failNext('update');
  await assert.rejects(
    get(api.update(1, { name: 'Changed', email: 'ada@example.com' })),
    (e) => e.code === 503,
  );
  assert.equal((await get(api.list()))[0].name, 'Ada');
});
test('stale updates and deletes conflict without overwriting the server', async () => {
  const api = new PracticeContactsApi();
  api.changeElsewhere(1);
  await assert.rejects(
    get(api.update(1, { name: 'Stale', email: 'ada@example.com' }, 1)),
    (e) => e.code === 409,
  );
  await assert.rejects(get(api.delete(1, 1)), (e) => e.code === 409);
  const current = (await get(api.list()))[0];
  assert.equal(current.name, 'Ada Remote');
  assert.equal(current.version, 2);
  await get(api.update(1, { name: 'Resolved', email: current.email }, current.version));
  assert.equal((await get(api.list()))[0].name, 'Resolved');
});
test('returned objects are copies and separate previews have independent servers', async () => {
  const api = new PracticeContactsApi(),
    other = new PracticeContactsApi();
  const list = await get(api.list());
  list[0].name = 'Unsaved';
  list.pop();
  assert.equal((await get(api.list()))[0].name, 'Ada');
  await get(api.delete(1));
  assert.equal((await get(other.list())).length, 2);
});
test('cold operations and cancellation do not create records', async () => {
  const api = new PracticeContactsApi();
  const pending = api.create({ name: 'Lin', email: 'lin@example.com' });
  assert.equal((await get(api.list())).length, 2);
  const subscription = pending.subscribe();
  subscription.unsubscribe();
  await new Promise((resolve) => setTimeout(resolve, 180));
  assert.equal((await get(api.list())).length, 2);
});
test('delete and list failures are one-shot and missing records produce errors', async () => {
  const api = new PracticeContactsApi();
  api.failNext('delete');
  await get(api.list()); // A different operation must not consume the armed failure.
  await assert.rejects(get(api.delete(1)), (e) => e.code === 503);
  assert.equal((await get(api.list())).length, 2);
  await get(api.delete(1));
  await assert.rejects(get(api.delete(1)), (e) => e.code === 404);
  api.failNext('list');
  await assert.rejects(get(api.list()), (e) => e.code === 503);
  assert.equal((await get(api.list())).length, 1);
});
