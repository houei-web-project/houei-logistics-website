import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {classificationPrompt, composeAnswer, guardAnswer, intentSchema, source} from './knowledge.mjs';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const PORT = Number(process.env.PORT || 4317);
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';
const TIMEOUT = Number(process.env.AI_TIMEOUT_MS || 120000);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.webmanifest':'application/manifest+json'};
let active = 0;
const requests = [];

function json(res, status, value) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(value));
}
async function body(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 20000) throw new Error('too-large');
  }
  return JSON.parse(data);
}

async function chat(req, res) {
  if (req.method !== 'POST') return json(res,405,{error:'POSTで送信してください。'});
  if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return json(res,403,{error:'このプレビュー画面からご利用ください。'});
  if (!req.headers['content-type']?.startsWith('application/json')) return json(res,415,{error:'形式が正しくありません。'});
  let input;
  try { input = await body(req); } catch { return json(res,400,{error:'質問を短くして、もう一度お試しください。'}); }
  if (typeof input.message !== 'string' || !input.message.trim() || input.message.length > 600) return json(res,400,{error:'質問は1〜600文字で入力してください。'});
  const message = input.message.trim();
  const history = (Array.isArray(input.history) ? input.history : []).filter(m => m && ['user','assistant'].includes(m.role) && typeof m.content === 'string').slice(-6).map(m=>({role:m.role,content:m.content.slice(0,700)}));
  const guarded = guardAnswer(message);
  if (guarded) return json(res,200,{answer:guarded,source,mode:'verified-guidance'});
  const now = Date.now();
  while(requests.length && requests[0] < now - 60000) requests.shift();
  if (active >= 2 || requests.length >= 12) return json(res,429,{error:'ただいま回答中です。少し待ってからお試しください。'});
  requests.push(now);
  active++;
  try {
    const upstream = await fetch(`${OLLAMA}/api/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      signal:AbortSignal.timeout(TIMEOUT),
      body:JSON.stringify({model:MODEL,stream:false,format:intentSchema,keep_alive:'20m',messages:[{role:'system',content:classificationPrompt()},...history.slice(-4),{role:'user',content:message}],options:{temperature:0,num_predict:100,num_ctx:4096}}),
    });
    if (!upstream.ok) throw new Error('upstream-unavailable');
    const result = await upstream.json();
    const classification = JSON.parse(result.message?.content || '{}');
    const answer = composeAnswer(message, classification.topics);
    json(res,200,{answer,source,mode:'ai',model:MODEL});
  } catch(error) {
    json(res,503,{error: error.name === 'TimeoutError' ? '回答に時間がかかっています。少し待って、もう一度お試しください。' : 'AIに接続できませんでした。もう一度試すか、募集要項をご覧ください。'});
  } finally { active--; }
}

const server = http.createServer(async(req,res)=>{
  try {
    if(![`127.0.0.1:${PORT}`,`localhost:${PORT}`].includes(req.headers.host)) return json(res,403,{error:'ローカルプレビューのアドレスからご利用ください。'});
    const url = new URL(req.url,`http://127.0.0.1:${PORT}`);
    if (url.pathname === '/api/chat') return await chat(req,res);
    if (url.pathname === '/api/health') {
      try {
        const r = await fetch(`${OLLAMA}/api/tags`,{signal:AbortSignal.timeout(3000)});
        const data = await r.json();
        return json(res,200,{ready:data.models?.some(m=>m.name===MODEL) || false,model:MODEL});
      } catch { return json(res,200,{ready:false}); }
    }
    if (!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'プレビューからのフォーム送信は無効です。'});
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filename = path.resolve(ROOT, '.' + relative);
    if (!filename.startsWith(ROOT) || /\.cgi$/.test(filename)) return json(res,404,{error:'Not found'});
    const info = await stat(filename);
    if (!info.isFile()) return json(res,404,{error:'Not found'});
    const content = await readFile(filename);
    res.writeHead(200,{'Content-Type':types[path.extname(filename)] || 'application/octet-stream','Cache-Control':'no-cache','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:content);
  } catch { json(res,404,{error:'Not found'}); }
});
server.listen(PORT,'127.0.0.1',()=>console.log(`豊栄物流 AI採用相談プレビュー: http://127.0.0.1:${PORT}`));
