import {homedir} from 'node:os';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH || `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`);
const browser=await chromium.launch({headless:true});
const report=[];
try{
  for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
    for(const route of ['index','recruit']){
      for(const [label,base] of [['source','https://houei-butsuryu.co.jp'],['replica','http://127.0.0.1:4317']]){
        const page=await browser.newPage({viewport,deviceScaleFactor:1});
        await page.goto(`${base}/${route==='index'?'':route+'.html'}`,{waitUntil:'networkidle'});
        await page.evaluate(()=>document.fonts.ready);
        await page.waitForTimeout(4500);
        await page.evaluate(()=>{const chat=document.querySelector('houei-recruit-chat');if(chat)chat.style.display='none';});
        await page.screenshot({path:`qa/compare-${route}-${device}-${label}.png`});
        const boxes=await page.evaluate(()=>[...document.querySelectorAll('body > header,body > main,body > footer')].map(n=>{const b=n.getBoundingClientRect();return {tag:n.tagName,x:b.x,y:b.y,width:b.width,height:b.height};}));
        report.push({device,route,label,boxes});await page.close();
      }
    }
  }
  await writeFile('qa/comparison-layout.json',JSON.stringify(report,null,2));
  console.log('Reference screenshots and layout comparison saved.');
}finally{await browser.close();}
