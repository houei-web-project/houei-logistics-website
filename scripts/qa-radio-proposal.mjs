import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_PATH || `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`);
const base = process.env.RADIO_QA_URL || 'http://127.0.0.1:4328/houei-logistics-website/radio-proposal/';
await mkdir('qa', {recursive:true});
const browser = await chromium.launch({headless:true});
const report = {url:base, viewports:[]};
try {
  for (const [width,height] of [[1440,1000],[1024,900],[768,1024],[390,844],[320,720]]) {
    const page = await browser.newPage({viewport:{width,height}, reducedMotion:'reduce'});
    const errors = [], failed = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failed.push({url:response.url(),status:response.status()}); });
    const response = await page.goto(base, {waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    await page.evaluate(async () => {
      [...document.images].forEach(img => img.loading = 'eager');
      await Promise.all([...document.images].map(img => img.decode()));
      await document.fonts.ready;
    });
    const layout = await page.evaluate(() => ({
      overflow:document.documentElement.scrollWidth > innerWidth,
      invalidAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),
      background:getComputedStyle(document.querySelector('#console')).backgroundImage,
      font:getComputedStyle(document.body).fontFamily,
      h1:document.querySelectorAll('h1').length,
    }));
    assert.equal(layout.overflow,false,`horizontal overflow at ${width}`);
    assert.deepEqual(layout.invalidAnchors,[]);
    assert.equal(layout.h1,1);
    assert.match(layout.background,/rgb\(7, 11, 47\)/);
    assert.match(layout.background,/rgb\(23, 0, 91\)/);
    assert.match(layout.font,/Zen Kaku Gothic Antique/);
    assert.equal(await page.locator('houei-recruit-chat,script[src*="admin-link"]').count(),0);
    await page.screenshot({path:`qa/radio-${width}-top.png`});
    await page.screenshot({path:`qa/radio-${width}-full.png`,fullPage:true});
    if(width<=960) {
      const menu = page.locator('.menu-toggle');
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'),'true');
      assert.equal(await page.locator('#proposal-nav').isVisible(),true);
      await page.locator('#proposal-nav a[href="#system"]').click();
      assert.equal(await menu.getAttribute('aria-expanded'),'false');
      await menu.click();
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'),'false');
      assert.equal(await menu.evaluate(e=>document.activeElement===e),true);
    }
    const opener = page.locator('[data-console-open]');
    await opener.click();
    assert.equal(await page.locator('#console-dialog').evaluate(d=>d.open),true);
    const bounds = await page.locator('#console-dialog').boundingBox();
    assert.ok(bounds.x>=-1 && bounds.y>=-1 && bounds.x+bounds.width<=width+1 && bounds.y+bounds.height<=height+1,`dialog bounds at ${width}`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#console-dialog').open && !document.body.classList.contains('dialog-open'));
    assert.equal(await opener.evaluate(e=>document.activeElement===e),true);
    await opener.click();
    await page.locator('[data-console-close]').click();
    await page.waitForFunction(()=>!document.querySelector('#console-dialog').open);
    if(width===1440 || width===390) {
      for(const id of ['system','console','pilot','cost']) {
        await page.locator(`#${id}`).screenshot({path:`qa/radio-${width}-${id}.png`});
      }
    }
    if(width===1440) {
      const downloadPromise=page.waitForEvent('download');
      await page.locator('a[download]').first().click();
      const download=await downloadPromise;
      const data=await readFile(await download.path());
      assert.equal(data.subarray(0,5).toString(),'%PDF-');
      assert.match(download.suggestedFilename(),/導入提案\.pdf$/);
      await page.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++;});
      await page.locator('[data-print]').click();
      assert.equal(await page.evaluate(()=>window.__printCalls),1);
      await page.emulateMedia({media:'print'});
      assert.equal(await page.locator('.proposal-header').isVisible(),false);
      await page.pdf({path:'qa/radio-print.pdf',printBackground:true,preferCSSPageSize:true});
      report.pdfDownload=true; report.printButton=true; report.printPDF=true;
    }
    assert.deepEqual(errors,[]); assert.deepEqual(failed,[]);
    report.viewports.push({width,imagesLoaded:true,overflow:false,dialog:true,focusRestored:true,menu:width<=960,errors,failed});
    await page.close();
  }
  await writeFile('qa/radio-results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
