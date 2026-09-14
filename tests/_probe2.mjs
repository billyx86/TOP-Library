import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve('/tmp/gh-reviver/TOP-Library');
const server = http.createServer(async (req, res) => {
  const file = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const d = await readFile(file); res.end(d); } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(4202, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: '/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('console', (m) => console.log('CONSOLE:', m.type(), m.text()));
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
page.on('requestfailed', (r) => console.log('REQFAIL:', r.url(), r.failure()?.errorText));
await page.goto('http://127.0.0.1:4202/');
console.log('TITLE:', await page.title());
await page.fill('#book-title', 'Probe');
await page.fill('#book-author', 'P');
await page.fill('#book-pages', '1');
await page.click('#add-book-submit');
await page.waitForTimeout(500);
console.log('CARDS:', await page.locator('#library .book-card').count());
console.log('COUNT:', await page.locator('#book-count').textContent().catch(() => 'N/A'));
console.log('HTML:', (await page.content()).slice(0, 300));
await browser.close(); server.close();
