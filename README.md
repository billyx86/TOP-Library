# TOP-Library

A simple personal library built with vanilla JavaScript modules. Add books
via the form, edit or remove them, and watch the shelf — it persists
across reloads. No framework, no build step: it's a static site you can
open straight from the file system.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .        # or: python3 -m http.server
```

## Features

- **Add books** — title, author and page count, validated on submit.
- **Edit & remove** — each card has Edit (reuses the form, fully validated
  on save) and Remove controls, plus a Cancel button for edits.
- **Persistence** — the library is saved to `localStorage` after every
  change and restored on load, so books survive a page reload.
- **On the shelf** — every book renders as a card; an empty state shows
  until the first book is added.
- **Validation** — empty fields, non-numeric, zero, negative and fractional
  page counts are all rejected with an inline error message — on both add
  and edit.
- **Resilient storage** — corrupt or partial saved data is dropped
  silently; quota and security failures are reported, never thrown.
- **Accessibility** — labelled inputs, `role="alert"` errors, live count.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Markup: the add-book form (doubles as edit form) and the library list. |
| `lib.js` | Pure, framework-free logic: the `Book` model (with stable ids), `parseBookInput()`, `addBook()`, `updateBook()`, `removeBook()`, and the storage round-trip via `saveLibrary()`/`loadLibrary()`. No DOM access, so it's fully unit-testable. |
| `script.js` | Thin UI layer — wires the form to `lib.js`, renders the shelf, and handles edit/remove mode and persistence. |
| `styles.css` | The stylesheet (linked directly by the page). |
| `lib.test.js` | Unit tests for the core logic (Node's built-in test runner). |
| `persistence.test.js` | Unit tests for the save/load round-trip, including corrupt data and quota failures. |
| `edit-remove.test.js` | Unit tests for `updateBook()` / `removeBook()`. |
| `tests/smoke.spec.js` | Playwright browser smoke tests: render, add, validate, edit, remove, and reload-persistence. |

## Tests

Two layers:

```bash
npm test                     # 28 unit tests (node:test)
npx playwright test          # 6 browser smoke tests (Playwright)
```

The unit suite covers `lib.js` end to end using plain in-memory storage
mocks. The smoke suite drives the real page in headless Chromium — for a
local run without downloading browsers, point it at an existing
Chromium/Chrome:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npx playwright test
```

CI runs both on every push and pull request
(`.github/workflows/ci.yml`): a unit job and a smoke job that installs
Chromium via `npx playwright install --with-deps`.
