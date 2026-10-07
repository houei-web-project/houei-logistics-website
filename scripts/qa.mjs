import {homedir} from 'node:os';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH || `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`);
await mkdir('qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const results={pages:[],chat:[],externalRequests:[]};
const site='http://127.0.0.1:4317';
try {
  for(const [label,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    const page=await browser.newPage({viewport,deviceScaleFactor:1});
    let errors=[];
    let failures=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(site)&&r.status()>=400)failures.push({url:r.url(),status:r.status()});});
    page.on('request',r=>{if(/google-analytics|googletagmanager|mailformpro\.cgi/.test(r.url()))results.externalRequests.push(r.url());});
    for(const name of ['index','about','service','company','recruit','contact','privacy-policy']) {
      errors=[];failures=[];
      await page.goto(`${site}/${name}.html`,{waitUntil:'networkidle'});
      await page.waitForTimeout(800);
      const report=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'))}));
      results.pages.push({name,viewport:label,errors:[...errors],failures:[...failures],...report});
      assert.deepEqual(errors,[],`${name} JS errors`);
      assert.deepEqual(failures,[],`${name} HTTP failures`);
      assert.deepEqual(report.brokenImages,[],`${name} images`);
      assert.equal(report.overflow,false,`${name} overflow`);
      if(name==='index'||name==='recruit'){
        await page.waitForTimeout(4000);
        await page.screenshot({path:`qa/${name}-${label}.png`});
      }
    }
    await page.goto(site,{waitUntil:'networkidle'});
    await page.waitForTimeout(4000);
    await page.getByRole('button',{name:'AI採用相談を開く'}).click();
    await page.waitForTimeout(300);
    const box=await page.locator('houei-recruit-chat').locator('.panel').boundingBox();
    assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,'chat fits viewport');
    await page.getByRole('button',{name:'大型免許がなくても応募できる？',exact:true}).click();
    await page.locator('houei-recruit-chat').locator('.message:not(.user) .text').filter({hasText:'会社負担'}).waitFor({timeout:125000});
    assert.equal(await page.locator('houei-recruit-chat').locator('.error').count(),0);
    await page.screenshot({path:`qa/chat-${label}.png`});
    await page.getByRole('button',{name:'チャットを閉じる'}).click();
    await page.getByRole('button',{name:'AI採用相談を開く'}).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button',{name:'AI採用相談を開く'}).isVisible(),true);
    // A real failed request must be visible and must offer retry.
    await page.route('**/api/chat',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'AIに接続できませんでした。'})}));
    await page.getByRole('button',{name:'AI採用相談を開く'}).click();
    await page.getByRole('textbox',{name:'採用についての質問'}).fill('未経験です');
    await page.getByRole('button',{name:'質問を送信'}).click();
    await page.getByRole('button',{name:'もう一度試す'}).waitFor();
    await page.unroute('**/api/chat');
    results.chat.push({viewport:label,liveAI:true,openCloseEscape:true,errorRetry:true});
    await page.close();
  }
  const page=await browser.newPage();
  const outbound=[];page.on('request',r=>{if(r.method()==='POST')outbound.push(r.url());});
  await page.goto(`${site}/contact.html`,{waitUntil:'networkidle'});
  await page.locator('form[data-preview-form] button[type="submit"]').click();
  assert.equal(await page.locator('[data-demo-note]').isVisible(),true);
  assert.deepEqual(outbound,[]);
  results.form={outboundRequests:outbound,previewNotice:true};
  assert.deepEqual(results.externalRequests,[]);
  await writeFile('qa/results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
} finally {await browser.close();}
