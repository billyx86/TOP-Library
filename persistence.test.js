import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Book, saveLibrary, loadLibrary, newId } from './lib.js';

/** In-memory stand-in for localStorage. */
function mockStorage() {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

/** A storage object whose setItem always throws (quota exceeded / disabled). */
function failingStorage() {
  return {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
}

test('newId: returns a unique, non-empty string', () => {
  const a = newId();
  const b = newId();
  assert.equal(typeof a, 'string');
  assert.ok(a.length > 0);
  assert.notEqual(a, b);
});

test('Book: uses a generated id by default, honours an explicit id', () => {
  const auto = new Book({ title: 'T', author: 'A', pages: 1 });
  assert.equal(typeof auto.id, 'string');
  assert.ok(auto.id.length > 0);
  const given = new Book({ title: 'T', author: 'A', pages: 1, id: 'xyz' });
  assert.equal(given.id, 'xyz');
});

test('saveLibrary: round-trips a library through a storage object', () => {
  const storage = mockStorage();
  const books = [
    new Book({ id: '1', title: 'Dune', author: 'Herbert', pages: 412 }),
    new Book({ id: '2', title: 'Neuromancer', author: 'Gibson', pages: 271 }),
  ];
  const result = saveLibrary(storage, books);
  assert.equal(result.saved, true);

  const loaded = loadLibrary(storage);
  assert.equal(loaded.length, 2);
  assert.equal(loaded[0].id, '1');
  assert.equal(loaded[0].title, 'Dune');
  assert.equal(loaded[0].author, 'Herbert');
  assert.equal(loaded[0].pages, 412);
  assert.equal(loaded[1].title, 'Neuromancer');
});

test('saveLibrary: tolerates a non-array library (saves an empty list)', () => {
  const storage = mockStorage();
  const result = saveLibrary(storage, undefined);
  assert.equal(result.saved, true);
  assert.deepEqual(loadLibrary(storage), []);
});

test('saveLibrary: storage failure is reported, not thrown', () => {
  const result = saveLibrary(failingStorage(), [
    new Book({ title: 'T', author: 'A', pages: 1 }),
  ]);
  assert.equal(result.saved, false);
  assert.match(result.error, /QuotaExceededError/);
});

test('loadLibrary: empty storage → empty list', () => {
  assert.deepEqual(loadLibrary(mockStorage()), []);
});

test('loadLibrary: corrupt JSON → empty list (no throw)', () => {
  const storage = mockStorage();
  storage.setItem('top-library.books', '{not json!!');
  assert.deepEqual(loadLibrary(storage), []);
});

test('loadLibrary: non-array payload → empty list', () => {
  const storage = mockStorage();
  storage.setItem('top-library.books', JSON.stringify({ title: 'not an array' }));
  assert.deepEqual(loadLibrary(storage), []);
});

test('loadLibrary: drops invalid entries, keeps valid ones', () => {
  const storage = mockStorage();
  storage.setItem(
    'top-library.books',
    JSON.stringify([
      { id: '1', title: 'Good', author: 'A', pages: 100 },
      { id: '2', title: '', author: 'A', pages: 100 }, // no title
      { id: '3', title: 'B', author: 'B', pages: -5 }, // bad pages
      { id: '4', title: 'C', author: 'C', pages: '1.5' }, // fractional
      'garbage', // non-object
      null,
    ]),
  );
  const loaded = loadLibrary(storage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, '1');
});

test('loadLibrary: a storage that throws on read → empty list', () => {
  assert.deepEqual(loadLibrary(failingStorage()), []);
});

test('save → load preserves ids so edit/remove can target books', () => {
  const storage = mockStorage();
  const books = [new Book({ title: 'T', author: 'A', pages: 1 })];
  saveLibrary(storage, books);
  const loaded = loadLibrary(storage);
  assert.equal(loaded[0].id, books[0].id);
});
