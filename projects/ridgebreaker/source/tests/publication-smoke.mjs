import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

let server;
const origin = process.argv[2] || 'http://127.0.0.1:4174';
if (!process.argv[2]) {
  const root = resolve('.publish');
  server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, origin).pathname);
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(root, '.' + path);
      if (!file.startsWith(root + sep)) throw new Error('Invalid path');
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2' };
      res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch { res.statusCode = 404; res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(4174, '127.0.0.1', resolve));
}
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin + '/', {waitUntil:'networkidle'});
  assert.equal(await page.getByRole('heading', {name:'Personal portfolio',exact:true}).count(),0);
  const gameLink = page.getByRole('link',{name:'Play Ridgebreaker Wild Ascent'});
  assert.equal(await gameLink.count(),1);
  assert.equal(await gameLink.getAttribute('href'),'https://nahmad0.github.io/projects/ridgebreaker/');
  page.on('response', res => { if(res.url().includes('/projects/ridgebreaker/') && res.status()>=400) errors.push(res.status()+' '+res.url()); });
  await page.goto(origin + '/projects/ridgebreaker/', {waitUntil:'networkidle'});
  await page.locator('#start').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.evaluate(()=>typeof window.__game),'undefined');
  await page.locator('#start').click();
  await page.keyboard.down('KeyW');
  await page.waitForFunction(()=>Number(document.querySelector('#speed')?.textContent)>0,{},{timeout:15000});
  await page.keyboard.up('KeyW');
  assert.equal(await page.locator('#hud').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({origin,homepageUpdated:true,productionGameStarted:true,truckMoved:true,assetErrors:errors}));
} finally { await browser.close(); if(server)server.close(); }
