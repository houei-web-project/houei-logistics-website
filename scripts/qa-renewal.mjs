import {homedir} from 'node:os';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH || `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`);
const site=process.env.QA_SITE || 'http://127.0.0.1:4317';
await mkdir('qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const report={viewports:[]};
try{
  for(const [width,height] of [[1440,1000],[768,1024],[390,844],[320,720]]){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[],failed=[],aiRequests=[];
    page.on('request',r=>{if(/\/api\/chat|semantic-demo\.mjs|huggingface|cdn\.jsdelivr\.net|\.onnx(?:$|[?#])|\.wasm(?:$|[?#])/i.test(r.url()))aiRequests.push(r.url());});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
    await page.goto(`${site}/renewal.html`,{waitUntil:'networkidle'});
    await page.evaluate(async()=>{
      [...document.images].forEach(i=>i.loading='eager');
      await Promise.all([...document.images].map(i=>i.decode()));
      await document.fonts.ready;
    });
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);
    await page.screenshot({path:`qa/renewal-${width}-viewport.png`});
    if(width<=960){
      await page.getByRole('button',{name:'メニューを開く',exact:true}).click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
      await page.locator('#site-nav a[href="#services"]').click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
      await page.getByRole('button',{name:'メニューを開く',exact:true}).click();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
    }
    await page.locator('.service-copy summary').first().click();
    assert.equal(await page.locator('.service-copy details').first().evaluate(d=>d.open),true);
    await page.locator('.faq-list summary').first().click();
    assert.equal(await page.locator('.faq-list details').first().evaluate(d=>d.open),true);
    await page.getByRole('button',{name:'仕事のことを相談する',exact:true}).click();
    const panel=page.locator('houei-recruit-chat').locator('.panel');
    assert.equal(await panel.isVisible(),true);
    await page.waitForTimeout(300);
    const bounds=await panel.boundingBox();
    assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1,`chat bounds at ${width}`);
    assert.equal(await page.locator('houei-recruit-chat').locator('.header').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(23, 0, 91)');
    const chat=page.locator('houei-recruit-chat');
    assert.equal(await chat.locator('textarea,input').count(),0);
    const ids=await chat.locator('[data-question-id]').evaluateAll(nodes=>nodes.map(node=>node.dataset.questionId));
    assert.equal(ids.length,11);
    for(const id of ids){
      await chat.locator(`[data-question-id="${id}"]`).click();
      await chat.locator(`[data-answer-id="${id}"]`).waitFor({state:'visible',timeout:1000});
      if(id==='license'){
        assert.match(await chat.locator('.message.assistant .text').innerText(),/会社負担/);
        await page.screenshot({path:`qa/renewal-${width}-chat.png`});
      }
      await chat.locator('[data-reset-questions]').click();
    }
    assert.deepEqual(aiRequests,[]);
    await page.locator('houei-recruit-chat').getByRole('link',{name:'募集要項を見る',exact:true}).click();
    assert.equal(await panel.isVisible(),false);
    assert.ok(page.url().endsWith('/renewal.html#jobs'),'chat stays on the new design');
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    report.viewports.push({width,imagesLoaded:true,overflow:false,errors,menu:true,accordions:true,chatTheme:true,fixedAnswers:ids.length,aiRequests:0});
    await page.close();
  }
  await writeFile('qa/renewal-results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
