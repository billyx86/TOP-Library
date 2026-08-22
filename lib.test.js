import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Book, parseBookInput, addBook } from './lib.js';

test('Book builds a record and formats a summary', () => {
  const b = new Book({ title: 'Dune', author: 'Herbert', pages: 412 });
  assert.equal(b.title, 'Dune');
  assert.equal(b.author, 'Herbert');
  assert.equal(b.pages, 412);
  assert.equal(b.toString(), 'Dune — Herbert (412 pages)');
});

test('parseBookInput: valid input coerces pages to a number', () => {
  const r = parseBookInput({ title: '  Dune  ', author: 'Herbert', pages: '412' });
  assert.equal(r.valid, true);
  assert.deepEqual(r.errors, []);
  assert.equal(r.book.title, 'Dune'); // trimmed
  assert.equal(r.book.pages, 412);
  assert.equal(typeof r.book.pages, 'number');
});

test('parseBookInput: empty title and author are rejected', () => {
  const r = parseBookInput({ title: '   ', author: '', pages: '10' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.includes('Title is required.'));
  assert.ok(r.errors.includes('Author is required.'));
});

test('parseBookInput: missing pages → "required" message', () => {
  for (const pages of ['', '   ']) {
    const r = parseBookInput({ title: 'T', author: 'A', pages });
    assert.equal(r.valid, false, `pages=${JSON.stringify(pages)} should be invalid`);
    assert.ok(r.errors.includes('Pages is required.'));
  }
});

test('parseBookInput: NaN / zero / negative / fractional pages → "positive whole number"', () => {
  for (const pages of ['abc', '0', '-5', '1.5']) {
    const r = parseBookInput({ title: 'T', author: 'A', pages });
    assert.equal(r.valid, false, `pages=${JSON.stringify(pages)} should be invalid`);
    assert.ok(r.errors.includes('Pages must be a positive whole number.'));
  }
});

test('parseBookInput: numeric-string pages are accepted (e.g. "1e3" → 1000)', () => {
  const r = parseBookInput({ title: 'T', author: 'A', pages: '1e3' });
  assert.equal(r.valid, true);
  assert.equal(r.book.pages, 1000);
});

test('parseBookInput: null/undefined input never throws', () => {
  const r = parseBookInput(null);
  assert.equal(r.valid, false);
  assert.equal(r.errors.length, 3);
});

test('addBook: appends a valid book and returns a NEW array', () => {
  const books = [new Book({ title: 'A', author: 'a', pages: 1 })];
  const before = books;
  const r = addBook(books, { title: 'B', author: 'b', pages: 2 });
  assert.equal(r.ok, true);
  assert.equal(r.books.length, 2);
  assert.equal(r.books[1].title, 'B');
  assert.notEqual(r.books, before, 'must not mutate the input array');
  assert.equal(before.length, 1, 'input array unchanged');
});

test('addBook: rejects invalid input and leaves the list untouched', () => {
  const books = [new Book({ title: 'A', author: 'a', pages: 1 })];
  const r = addBook(books, { title: '', author: 'b', pages: '0' });
  assert.equal(r.ok, false);
  assert.equal(r.books.length, 1);
  assert.ok(r.errors.length >= 2);
});

test('addBook: tolerates a non-array initial value', () => {
  const r = addBook(undefined, { title: 'First', author: 'f', pages: 9 });
  assert.equal(r.ok, true);
  assert.equal(r.books.length, 1);
});
