// UI layer. All validation and data logic lives in lib.js; this file only
// wires the DOM to that pure logic and handles rendering.
import { addBook } from './lib.js';

// In-memory library (reset on reload — no persistence yet, see roadmap).
let myLibrary = [];

const form = document.getElementById('add-book-form');
const titleInput = document.getElementById('book-title');
const authorInput = document.getElementById('book-author');
const pagesInput = document.getElementById('book-pages');
const errorList = document.getElementById('form-errors');
const libraryList = document.getElementById('library');
const emptyState = document.getElementById('empty-state');
const countBadge = document.getElementById('book-count');

function renderError(message) {
  errorList.textContent = message || '';
  errorList.hidden = !message;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLibrary() {
  libraryList.innerHTML = '';
  emptyState.hidden = myLibrary.length > 0;
  countBadge.textContent = myLibrary.length === 1 ? '1 book' : `${myLibrary.length} books`;

  for (const book of myLibrary) {
    const li = document.createElement('li');
    li.className = 'book-card';

    const h3 = document.createElement('h3');
    h3.className = 'book-title';
    h3.textContent = book.title;

    const p = document.createElement('p');
    p.className = 'book-meta';
    p.textContent = `by ${book.author}`;

    const span = document.createElement('span');
    span.className = 'book-pages';
    span.textContent = `${book.pages} pages`;

    li.append(h3, p, span);
    libraryList.append(li);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const result = addBook(myLibrary, {
    title: titleInput.value,
    author: authorInput.value,
    pages: pagesInput.value,
  });

  if (!result.ok) {
    myLibrary = result.books;
    renderLibrary();
    renderError(result.errors.join(' '));
    return;
  }

  myLibrary = result.books;
  renderLibrary();
  renderError('');
  form.reset();
  titleInput.focus();
});

renderLibrary();
