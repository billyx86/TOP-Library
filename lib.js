// Pure, framework-free library logic. No DOM access — fully unit-testable.
// The browser UI (script.js) imports these; tests import them directly.

/**
 * Generate a unique id. Uses crypto.randomUUID() where available (all modern
 * browsers and Node >= 19) and falls back to a timestamp+random string so the
 * module also works in non-secure contexts.
 */
export function newId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class Book {
  constructor({ title, author, pages, id }) {
    this.id = id ?? newId();
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

/**
 * Serialise a library to JSON for storage. Pure: takes a storage object that
 * implements { getItem, setItem } (localStorage in the browser, a plain mock
 * in tests). Never throws — storage failures (quota, disabled) yield
 * { saved: false, error: '...' } so the caller can degrade gracefully.
 *
 * @param {{getItem: Function, setItem: Function}} storage
 * @param {Book[]} books
 * @param {string} [key]
 * @returns {{saved: boolean, error?: string}}
 */
export function saveLibrary(storage, books, key = 'top-library.books') {
  const list = Array.isArray(books) ? books : [];
  const payload = JSON.stringify(
    list.map((b) => ({ id: b.id, title: b.title, author: b.author, pages: b.pages })),
  );
  try {
    storage.setItem(key, payload);
    return { saved: true };
  } catch (err) {
    return { saved: false, error: String(err?.message ?? err) };
  }
}

/**
 * Load and validate a library from storage. Pure and defensive:
 * - missing storage / missing key → empty list
 * - corrupt JSON → empty list (never throws)
 * - non-array payload → empty list
 * - entries missing required fields or with bad pages → dropped
 *
 * @param {{getItem: Function, setItem: Function}} storage
 * @param {string} [key]
 * @returns {Book[]}
 */
export function loadLibrary(storage, key = 'top-library.books') {
  let raw;
  try {
    raw = storage.getItem(key);
  } catch {
    return [];
  }
  if (raw == null || raw === '') return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const books = [];
  for (const entry of parsed) {
    if (entry == null || typeof entry !== 'object') continue;
    const title = String(entry.title ?? '').trim();
    const author = String(entry.author ?? '').trim();
    const pages = Number(entry.pages);
    if (!title || !author) continue;
    if (!Number.isInteger(pages) || pages <= 0) continue;
    books.push(new Book({ id: String(entry.id ?? ''), title, author, pages }));
  }
  return books;
}
