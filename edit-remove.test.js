import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Book, updateBook, removeBook } from './lib.js';

const shelf = [
  new Book({ id: '1', title: 'Dune', author: 'Herbert', pages: 412 }),
  new Book({ id: '2', title: 'Neuromancer', author: 'Gibson', pages: 271 }),
];

test('updateBook: applies a valid patch, keeps the id, returns a NEW array', () => {
  const r = updateBook(shelf, '1', { title: 'Dune', author: 'Frank Herbert', pages: '608' });
  assert.equal(r.ok, true);
  assert.equal(r.books.length, 2);
  assert.equal(r.books[0].id, '1', 'id must survive the edit');
  assert.equal(r.books[0].author, 'Frank Herbert');
  assert.equal(r.books[0].pages, 608);
  assert.notEqual(r.books, shelf, 'must not mutate the input array');
  assert.equal(shelf[0].author, 'Herbert', 'input book unchanged');
});

test('updateBook: edits the right book when ids are not in order', () => {
  const r = updateBook(shelf, '2', { title: 'Neuromancer', author: 'W. Gibson', pages: 320 });
  assert.equal(r.ok, true);
  assert.equal(r.books[1].author, 'W. Gibson');
  assert.equal(r.books[0].title, 'Dune', 'the other book is untouched');
});

test('updateBook: unknown id → not found, list untouched', () => {
  const r = updateBook(shelf, 'nope', { title: 'T', author: 'A', pages: 10 });
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors, ['Book not found.']);
  assert.equal(r.books.length, 2);
});

test('updateBook: invalid patch is rejected with the usual validation errors', () => {
  const r = updateBook(shelf, '1', { title: '', author: '', pages: '-1' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.includes('Title is required.'));
  assert.ok(r.errors.includes('Author is required.'));
  assert.ok(r.errors.includes('Pages must be a positive whole number.'));
  assert.equal(r.books[0].title, 'Dune', 'list unchanged on failure');
});

test('removeBook: removes the targeted book, preserves order, new array', () => {
  const r = removeBook(shelf, '1');
  assert.equal(r.ok, true);
  assert.equal(r.books.length, 1);
  assert.equal(r.books[0].id, '2');
  assert.notEqual(r.books, shelf, 'must not mutate the input array');
  assert.equal(shelf.length, 2, 'input array unchanged');
});

test('removeBook: unknown id → not found, list untouched', () => {
  const r = removeBook(shelf, 'nope');
  assert.equal(r.ok, false);
  assert.equal(r.books.length, 2);
});

test('removeBook: removing from an empty list is a no-op failure', () => {
  const r = removeBook([], '1');
  assert.equal(r.ok, false);
  assert.deepEqual(r.books, []);
});
