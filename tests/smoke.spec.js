// Browser smoke tests: load the real page and drive the rendered UI.
// A minimal static server is started in-memory so ES modules work
// (file:// would block them).
import { test, expect } from '@playwright/test';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4199;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

let server;
let baseUrl;

test.beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const filePath = path.join(ROOT, file);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const data = await readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] ?? 'text/plain' });
      res.end(data);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${PORT}/`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('fresh load shows the empty state and zero count', async ({ page }) => {
  await page.goto(baseUrl);
  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(page.locator('#book-count')).toHaveText('0 books');
  await expect(page.locator('#library .book-card')).toHaveCount(0);
});

test('adding a valid book renders a card, bumps the count and resets the form', async ({
  page,
}) => {
  await page.goto(baseUrl);
  await page.fill('#book-title', 'Dune');
  await page.fill('#book-author', 'Frank Herbert');
  await page.fill('#book-pages', '412');
  await page.click('#add-book-submit');

  const card = page.locator('#library .book-card').first();
  await expect(card).toHaveText(/Dune/);
  await expect(card).toHaveText(/Frank Herbert/);
  await expect(card).toHaveText(/412 pages/);
  await expect(page.locator('#book-count')).toHaveText('1 book');
  await expect(page.locator('#empty-state')).toBeHidden();
  await expect(page.locator('#book-title')).toHaveValue('');
});

test('invalid input shows the inline alert and adds nothing', async ({ page }) => {
  await page.goto(baseUrl);
  await page.fill('#book-title', '  ');
  await page.fill('#book-author', 'Nobody');
  await page.fill('#book-pages', '1.5');
  await page.click('#add-book-submit');

  const errors = page.locator('#form-errors');
  await expect(errors).toBeVisible();
  await expect(errors).toHaveText(/Title is required\./);
  await expect(errors).toHaveText(/positive whole number/);
  await expect(page.locator('#library .book-card')).toHaveCount(0);
});

test('edit flow: Edit populates the form, Save applies the change', async ({ page }) => {
  await page.goto(baseUrl);
  await page.fill('#book-title', 'Neuromancer');
  await page.fill('#book-author', 'Gibson');
  await page.fill('#book-pages', '271');
  await page.click('#add-book-submit');

  await page.click('#library .book-card .book-action--edit');
  await expect(page.locator('#add-heading')).toHaveText('Edit book');
  await expect(page.locator('#book-title')).toHaveValue('Neuromancer');
  await expect(page.locator('#cancel-edit')).toBeVisible();

  await page.fill('#book-author', 'William Gibson');
  await page.click('#add-book-submit');

  await expect(page.locator('#add-heading')).toHaveText('Add a book');
  await expect(page.locator('#library .book-card')).toHaveCount(1);
  await expect(page.locator('#library .book-card')).toHaveText(
    /Neuromancer\s*by William Gibson/,
  );
  await expect(page.locator('#book-count')).toHaveText('1 book');
});

test('remove flow: Remove deletes the card', async ({ page }) => {
  await page.goto(baseUrl);
  await page.fill('#book-title', 'A Book');
  await page.fill('#book-author', 'Someone');
  await page.fill('#book-pages', '10');
  await page.click('#add-book-submit');
  await expect(page.locator('#library .book-card')).toHaveCount(1);

  await page.click('#library .book-card .book-action--remove');
  await expect(page.locator('#library .book-card')).toHaveCount(0);
  await expect(page.locator('#book-count')).toHaveText('0 books');
  await expect(page.locator('#empty-state')).toBeVisible();
});

test('the library survives a page reload (localStorage persistence)', async ({ page }) => {
  await page.goto(baseUrl);
  await page.fill('#book-title', 'The Hobbit');
  await page.fill('#book-author', 'Tolkien');
  await page.fill('#book-pages', '310');
  await page.click('#add-book-submit');
  await expect(page.locator('#library .book-card')).toHaveCount(1);

  await page.reload();
  await expect(page.locator('#library .book-card')).toHaveCount(1);
  await expect(page.locator('#library .book-card')).toHaveText(/The Hobbit/);
  await expect(page.locator('#book-count')).toHaveText('1 book');
});

// --- search / filter (issue #11) -------------------------------------------

async function addBookViaForm(page, title, author, pages) {
  await page.fill('#book-title', title);
  await page.fill('#book-author', author);
  await page.fill('#book-pages', pages);
  await page.click('#add-book-submit');
}

test('search box filters by title, case-insensitively', async ({ page }) => {
  await page.goto(baseUrl);
  await addBookViaForm(page, 'Dune', 'Frank Herbert', '412');
  await addBookViaForm(page, 'Neuromancer', 'William Gibson', '271');
  await expect(page.locator('#library .book-card')).toHaveCount(2);

  await page.fill('#library-search', 'dune');
  await expect(page.locator('#library .book-card')).toHaveCount(1);
  await expect(page.locator('#library .book-card')).toHaveText(/Dune/);

  // Clearing restores the full list.
  await page.fill('#library-search', '');
  await expect(page.locator('#library .book-card')).toHaveCount(2);
});

test('search box filters by author and shows a no-match state', async ({ page }) => {
  await page.goto(baseUrl);
  await addBookViaForm(page, 'Dune', 'Frank Herbert', '412');
  await addBookViaForm(page, 'Neuromancer', 'William Gibson', '271');

  await page.fill('#library-search', 'gibson');
  await expect(page.locator('#library .book-card')).toHaveCount(1);
  await expect(page.locator('#library .book-card')).toHaveText(/Neuromancer/);
  await expect(page.locator('#no-match')).toBeHidden();

  await page.fill('#library-search', 'nobody-here');
  await expect(page.locator('#library .book-card')).toHaveCount(0);
  await expect(page.locator('#no-match')).toBeVisible();
  // The shelf is not empty — only the search matched nothing.
  await expect(page.locator('#empty-state')).toBeHidden();
});

test('#book-count shows the TOTAL, not the filtered count', async ({ page }) => {
  await page.goto(baseUrl);
  await addBookViaForm(page, 'Dune', 'Frank Herbert', '412');
  await addBookViaForm(page, 'Neuromancer', 'William Gibson', '271');

  await page.fill('#library-search', 'dune');
  await expect(page.locator('#library .book-card')).toHaveCount(1);
  // Still two books on the shelf — the filter does not shrink the total.
  await expect(page.locator('#book-count')).toHaveText('2 books');
});

