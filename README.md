# TOP-Library

A simple personal library built with vanilla JavaScript objects. Add books
via the form and watch them appear on the shelf. No framework, no build
step — it's a static site you can open straight from the file system.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .        # or: python3 -m http.server
```

## Features

- **Add books** — title, author and page count, validated on submit.
- **On the shelf** — every book renders as a card; an empty state shows
  until the first book is added.
- **Validation** — empty fields, non-numeric, zero, negative and fractional
  page counts are all rejected with an inline error message.
- **Accessibility** — labelled inputs, `role="alert"` errors, live count.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Markup: the add-book form and the library list. |
| `lib.js` | Pure, framework-free logic: the `Book` model plus `parseBookInput()` and `addBook()`. No DOM access, so it's fully unit-testable. |
| `script.js` | Thin UI layer — wires the form to `lib.js` and renders the shelf. |
| `styles.css` | The stylesheet (linked directly by the page). |
| `lib.test.js` | Unit tests for `lib.js` (Node's built-in test runner). |

## Tests

The core logic is covered by a dependency-free unit-test suite that uses
Node's built-in `node:test` runner — no `node_modules`, no lockfile.

```bash
npm test
```

CI runs the same suite on every push and pull request
(`.github/workflows/ci.yml`).
