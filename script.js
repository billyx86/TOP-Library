// UI layer. All validation and data logic lives in lib.js; this file only
// wires the DOM to that pure logic and handles rendering.
import { addBook, loadLibrary, saveLibrary, updateBook, removeBook } from './lib.js';

// Library restored from localStorage (books survive a page reload).
let myLibrary = loadLibrary(window.localStorage);
let storageOk = true;
let editingId = null;

const form = document.getElementById('add-book-form');
const formHeading = document.getElementById('add-heading');
const titleInput = document.getElementById('book-title');
const authorInput = document.getElementById('book-author');
const pagesInput = document.getElementById('book-pages');
const errorList = document.getElementById('form-errors');
const submitButton = document.getElementById('add-book-submit');
const cancelButton = document.getElementById('cancel-edit');
const libraryList = document.getElementById('library');
const emptyState = document.getElementById('empty-state');
const countBadge = document.getElementById('book-count');

function renderError(message) {
  errorList.textContent = message || '';
  errorList.hidden = !message;
}

function persist() {
  const result = saveLibrary(window.localStorage, myLibrary);
  storageOk = result.saved;
}

function enterEditMode(book) {
  editingId = book.id;
  titleInput.value = book.title;
  authorInput.value = book.author;
  pagesInput.value = String(book.pages);
  formHeading.textContent = 'Edit book';
  submitButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  renderError('');
  titleInput.focus();
}

function exitEditMode() {
  editingId = null;
  formHeading.textContent = 'Add a book';
  submitButton.textContent = 'Add to library';
  cancelButton.hidden = true;
  form.reset();
}

function createButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function renderLibrary() {
  libraryList.innerHTML = '';
  emptyState.hidden = myLibrary.length > 0;
  countBadge.textContent = myLibrary.length === 1 ? '1 book' : `${myLibrary.length} books`;

  for (const book of myLibrary) {
    const li = document.createElement('li');
    li.className = 'book-card';
    li.dataset.bookId = book.id;

    const h3 = document.createElement('h3');
    h3.className = 'book-title';
    h3.textContent = book.title;

    const p = document.createElement('p');
    p.className = 'book-meta';
    p.textContent = `by ${book.author}`;

    const span = document.createElement('span');
    span.className = 'book-pages';
    span.textContent = `${book.pages} pages`;

    const actions = document.createElement('div');
    actions.className = 'book-actions';

    const editButton = createButton('Edit', 'book-action book-action--edit', () =>
      enterEditMode(book),
    );
    const removeButton = createButton('Remove', 'book-action book-action--remove', () => {
      const result = removeBook(myLibrary, book.id);
      if (!result.ok) return;
      myLibrary = result.books;
      if (editingId === book.id) exitEditMode();
      renderLibrary();
      persist();
    });

    actions.append(editButton, removeButton);
    li.append(h3, p, span, actions);
    libraryList.append(li);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const input = {
    title: titleInput.value,
    author: authorInput.value,
    pages: pagesInput.value,
  };

  if (editingId !== null) {
    const result = updateBook(myLibrary, editingId, input);
    if (!result.ok) {
      renderError(result.errors.join(' '));
      return;
    }
    myLibrary = result.books;
    exitEditMode();
    renderLibrary();
    renderError('');
    persist();
    titleInput.focus();
    return;
  }

  const result = addBook(myLibrary, input);
  if (!result.ok) {
    myLibrary = result.books;
    renderLibrary();
    renderError(result.errors.join(' '));
    return;
  }

  myLibrary = result.books;
  renderLibrary();
  renderError('');
  persist();
  form.reset();
  titleInput.focus();
});

cancelButton.addEventListener('click', () => {
  exitEditMode();
  renderError('');
  titleInput.focus();
});

renderLibrary();
