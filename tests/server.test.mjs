import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('chat API validates input and reports unavailable/timed-out inference honestly',async()=>{
  let mode='ok';
  const model=http.createServer((req,res)=>{
    if(req.url==='/api/tags'){res.end(JSON.stringify({models:[{name:'qwen2.5-coder:3b'}]}));return;}
    if(mode==='hang')return;
    if(mode==='fail'){res.writeHead(500);res.end('{}');return;}
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:{content:'{"topics":["license"]}'}}));
  });
  model.listen(0,'127.0.0.1');await once(model,'listening');
  const proc=spawn(process.execPath,['server/index.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'4337',OLLAMA_URL:`http://127.0.0.1:${model.address().port}`,AI_TIMEOUT_MS:'200'},stdio:['ignore','pipe','pipe']});
  const request=(value,headers={})=>fetch('http://127.0.0.1:4337/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(value)});
  try{
    await Promise.race([once(proc.stdout,'data'),new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('test server failed to start')),5000);t.unref();})]);
    assert.equal((await request({message:''})).status,400);
    assert.equal((await request({message:'x'.repeat(601)})).status,400);
    assert.equal((await request({message:'免許'},{Origin:'https://example.com'})).status,403);
    const good=await request({message:'大型免許がありません'});
    assert.equal(good.status,200);assert.match((await good.json()).answer,/会社負担/);
    mode='fail';const failed=await request({message:'未経験です'});
    assert.equal(failed.status,503);assert.match((await failed.json()).error,/接続できません/);
    mode='hang';const timeout=await request({message:'勤務時間について'});
    assert.equal(timeout.status,503);assert.match((await timeout.json()).error,/時間がかかっています/);
    const guarded=await request({message:'62歳ですが応募できますか'});
    assert.equal(guarded.status,200);assert.match((await guarded.json()).answer,/応募可否をお答えできません/);
  }finally{
    proc.kill();await once(proc,'exit');model.closeAllConnections();await new Promise(resolve=>model.close(resolve));
  }
});
