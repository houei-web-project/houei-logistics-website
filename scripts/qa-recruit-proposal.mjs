import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {mkdir, writeFile} from 'node:fs/promises';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_PATH || `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`);
const base = process.env.PROPOSAL_QA_URL || 'http://127.0.0.1:4328/houei-logistics-website/proposal.html';
const report = {url:base, viewports:[]};
await mkdir('qa', {recursive:true});
const browser = await chromium.launch({headless:true});
try {
  for (const [width,height] of [[1440,1000],[1024,900],[768,1024],[390,844],[320,720]]) {
    const page = await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors = [], failed = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if(response.status()>=400) failed.push({url:response.url(),status:response.status()}); });
    assert.equal((await page.goto(base,{waitUntil:'networkidle'})).status(),200);
    await page.evaluate(async()=>{
      [...document.images].forEach(img=>img.loading='eager');
      await Promise.all([...document.images].map(img=>img.decode()));
      await document.fonts.ready;
    });
    const layout=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>innerWidth,
      anchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),
      text:document.body.textContent,
      font:getComputedStyle(document.body).fontFamily,
    }));
    assert.equal(layout.overflow,false,`horizontal overflow at ${width}`);
    assert.deepEqual(layout.anchors,[]);
    assert.doesNotMatch(layout.text,/業務効率化|社内資料検索|時間の削減|運送の相談/);
    assert.match(layout.font,/Zen Kaku Gothic Antique/);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('[data-section]').count(),4);
    const estimates=await page.locator('[data-consultations]').evaluateAll(cards=>cards.map(card=>({
      count:Number(card.dataset.consultations),yen:Number(card.dataset.estimateJpy),
      shown:Number(card.querySelector('.price-value strong').textContent.replaceAll(',','')),
    })));
    assert.deepEqual(estimates.map(item=>item.count),[100,500,1000]);
    for(const item of estimates) {
      assert.equal(item.yen,item.count*2.5);
      assert.equal(item.shown,item.yen);
      const unrounded=item.count*(10000*0.75+2000*4.5)/1e6*150;
      assert.ok(Math.abs(item.yen-unrounded)/unrounded<0.011);
    }
    assert.equal(await page.locator('.price-details').getAttribute('open'),null);
    await page.locator('.price-details summary').click();
    assert.equal(await page.locator('.price-details').evaluate(el=>el.open),true);
    assert.match(await page.locator('.price-details-body').innerText(),/2\.475円/);
    await page.locator('.price-details summary').click();
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:`qa/recruit-${width}-full.png`,fullPage:true});
    await page.screenshot({path:`qa/recruit-${width}-top.png`});
    await page.locator('#pricing').screenshot({path:`qa/recruit-${width}-pricing.png`});
    if(width<=960) {
      const menu=page.locator('.menu-toggle');
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'),'true');
      await page.locator('#proposal-nav a[href="#pricing"]').click();
      assert.equal(await menu.getAttribute('aria-expanded'),'false');
      await menu.click();
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'),'false');
      assert.equal(await menu.evaluate(el=>document.activeElement===el),true);
    }
    if(width===1440) {
      await page.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++;});
      await page.locator('[data-print]').click();
      assert.equal(await page.evaluate(()=>window.__printCalls),1);
      await page.emulateMedia({media:'print'});
      await page.pdf({path:'qa/recruit-print.pdf',printBackground:true,preferCSSPageSize:true});
      assert.equal(await page.locator('.price-details').evaluate(el=>el.open),false,'restore details after printing');
      await page.emulateMedia({media:'screen'});
      await page.locator('[data-demo-link]').first().click();
      assert.match(page.url(),/renewal\/#consult-title$/);
      await page.getByRole('button',{name:'仕事のことを相談する',exact:true}).click();
      assert.equal(await page.locator('houei-recruit-chat .panel').isVisible(),true);
      await page.locator('houei-recruit-chat .close').click();
      report.demoOpensChat=true;
      report.printButton=true;
      report.printPDF=true;
    }
    assert.deepEqual(errors,[]);
    assert.deepEqual(failed,[]);
    report.viewports.push({width,overflow:false,prices:true,details:true,menu:width<=960,errors,failed});
    await page.close();
  }
  await writeFile('qa/recruit-results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); }
