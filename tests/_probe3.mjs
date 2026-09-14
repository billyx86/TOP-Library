import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import path from 'node:path';

const ROOT = '/tmp/gh-reviver/TOP-Library';
const server = http.createServer(async (req, res) => {
  let p = req.url.split('?')[0];
  const file = p === '/' ? ROOT + '/index.html' : ROOT + p;
  try { const d = await readFile(file); res.end(d); } catch { res.writeHead(404).end('nf'); }
});
await new Promise((r) => server.listen(4203, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: '/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('console', (m) => console.log('CONSOLE:', m.type(), m.text()));
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
page.on('response', (r) => console.log('RESP:', r.status(), r.url()));
await page.goto('http://127.0.0.1:4203/');
await page.waitForTimeout(300);
const info = await page.evaluate(() => ({
  count: document.getElementById('book-count')?.textContent,
  empty: document.getElementById('empty-state')?.hidden,
}));
console.log('STATE:', JSON.stringify(info));
await browser.close(); server.close();
