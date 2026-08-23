// Pure, framework-free library logic. No DOM access — fully unit-testable.
// The browser UI (script.js) imports these; tests import them directly.

export class Book {
  constructor({ title, author, pages }) {
    this.title = title;
    this.author = author;
    this.pages = pages;
  }

  toString() {
    return `${this.title} — ${this.author} (${this.pages} pages)`;
  }
}

/**
 * Parse raw form input (all values are strings from the DOM) into a validated
 * book record. Returns { valid, errors, book }. Never throws.
 *
 * @param {{title?: string, author?: string, pages?: string}} raw
 * @returns {{valid: boolean, errors: string[], book: {title: string, author: string, pages: number}}}
 */
export function parseBookInput(raw) {
  const source = raw ?? {};
  const title = String(source.title ?? '').trim();
  const author = String(source.author ?? '').trim();
  const pagesRaw = String(source.pages ?? '').trim();

  const errors = [];
  let pages;

  if (!title) errors.push('Title is required.');
  if (!author) errors.push('Author is required.');

  if (!pagesRaw) {
    errors.push('Pages is required.');
  } else {
    const n = Number(pagesRaw);
    if (!Number.isInteger(n) || n <= 0) {
      errors.push('Pages must be a positive whole number.');
    } else {
      pages = n;
    }
  }

  return { valid: errors.length === 0, errors, book: { title, author, pages } };
}

/**
 * Append a book to an array of books after validation. Pure: returns a new
 * array, never mutates the input.
 *
 * @param {Book[]} books
 * @param {{title?: string, author?: string, pages?: string}} input
 * @returns {{ok: boolean, errors: string[], books: Book[]}}
 */
export function addBook(books, input) {
  const current = Array.isArray(books) ? books : [];
  const result = parseBookInput(input);
  if (!result.valid) {
    return { ok: false, errors: result.errors, books: current };
  }
  return { ok: true, errors: [], books: [...current, new Book(result.book)] };
}
