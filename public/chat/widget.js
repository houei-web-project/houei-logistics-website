(() => {
  'use strict';
  // Isolate all chat styles so the original website is visually unchanged.
  const host = document.createElement('houei-recruit-chat');
  document.body.append(host);
  const root = host.attachShadow({mode:'open'});
  const bubble = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 10h8M7 14h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  root.innerHTML = `
    <style>
      :host{position:fixed;right:24px;bottom:24px;z-index:2147483000;font-family:'Zen Kaku Gothic Antique',sans-serif;font-size:16px;line-height:1.65;color:#413f68;text-align:left;letter-spacing:0;box-sizing:border-box}
      *,*::before,*::after{box-sizing:border-box}button,input,textarea{font:inherit}button,a{-webkit-tap-highlight-color:transparent}button{cursor:pointer}button:disabled{cursor:wait}button:focus-visible,a:focus-visible,textarea:focus-visible{outline:3px solid #aaa4e0;outline-offset:3px}[hidden]{display:none!important}svg{width:24px;height:24px;flex-shrink:0}a{color:inherit}
      .launcher{display:flex;align-items:center;gap:13px;min-height:68px;background:#413f68;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:11px 22px 11px 14px;box-shadow:0 8px 32px #25213e35;text-align:left;transition:transform .2s,box-shadow .2s}
      .launcher:hover{transform:translateY(-3px);box-shadow:0 12px 34px #25213e4a}.launcher-icon{display:grid;place-items:center;width:43px;height:43px;background:#f3ff0f;color:#413f68;border-radius:50%}.launcher strong{display:block;font-size:15px;font-weight:700;letter-spacing:.05em}.launcher small{display:block;font-family:Montserrat,sans-serif;font-size:10px;letter-spacing:.15em;color:#f3ff0f;line-height:1.6}
      .panel{width:410px;height:min(660px,calc(100dvh - 48px));display:flex;flex-direction:column;background:#fafafa;border:1px solid #413f6825;border-radius:10px;box-shadow:0 18px 65px #17152640;overflow:hidden;animation:enter .22s ease-out}
      @keyframes enter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .header{display:flex;align-items:center;gap:12px;background:#413f68;color:#fff;padding:19px 20px 18px;flex-shrink:0}.header-icon{color:#f3ff0f}.header-copy{flex:1}.eyebrow{display:block;color:#f3ff0f;font-family:Montserrat,sans-serif;font-size:10px;letter-spacing:.17em;line-height:1.5}.header h2{font-size:18px;margin:3px 0 0;font-weight:700;letter-spacing:.04em}.close{display:grid;place-items:center;width:34px;height:34px;border:1px solid #ffffff38;border-radius:50%;background:transparent;color:#fff}.close:hover{background:#ffffff16}.close svg{width:17px;height:17px}
      .intro-label{padding:9px 18px;background:#f3ff0f;font-size:12px;color:#413f68;font-weight:700;letter-spacing:.025em;text-align:center;flex-shrink:0}
      .messages{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:22px 18px 12px;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:#d5d4de transparent}.byline{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.04em;margin:0 0 7px;color:#69677e}.mark{display:grid;place-items:center;background:#413f68;color:#f3ff0f;font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;width:23px;height:23px;border-radius:50%}.message{margin-bottom:18px}.text{padding:14px 16px;border:1px solid #e5e4eb;background:#fff;border-radius:0 10px 10px 10px;color:#393749;font-size:14px;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere}.user{margin-left:36px}.user .text{background:#eeedf5;color:#413f68;border-color:#e1dfed;border-radius:10px 0 10px 10px}.user .byline{justify-content:flex-end}.source{display:inline-block;font-size:11px;color:#7b788f;margin:6px 0 0 4px;text-decoration:underline;text-underline-offset:3px}.questions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.question{border:1px solid #ceccd9;color:#413f68;background:#fff;padding:9px 11px;border-radius:4px;font-size:12px;text-align:left;line-height:1.4;transition:background .15s}.question:hover{background:#f3ff0f;border-color:#413f68}.question:disabled{opacity:.45}.suggest-label{font-size:11px;color:#827e95;margin:16px 0 0;letter-spacing:.03em}
      .pending .text{color:#79758f;font-size:13px;display:flex;align-items:center;gap:10px}.dots{display:flex;gap:4px}.dots i{width:4px;height:4px;background:#77728f;border-radius:50%;animation:pulse 1s infinite}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}@keyframes pulse{50%{opacity:.25;transform:translateY(-2px)}}
      .error .text{background:#fffaf4;border-color:#ead9c3}.retry{margin-top:9px;background:#fff;border:1px solid #bcb8cd;border-radius:4px;padding:5px 12px;font-size:12px;color:#413f68}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 18px 12px;flex-shrink:0;border-top:1px solid #e8e7ee}.action{display:block;text-decoration:none;text-align:center;font-size:12px;font-weight:700;line-height:1.5;padding:10px 5px;border:1px solid #d7d5e1;border-radius:4px;background:#fff}.action:hover{background:#f3ff0f}.action.primary{border-color:#413f68;background:#413f68;color:#fff}.action.primary:hover{background:#56527e}.composer-wrap{padding:0 18px 13px;background:#fafafa;flex-shrink:0}.composer{display:flex;align-items:flex-end;border:1px solid #cfccdc;background:#fff;border-radius:5px;padding:7px;gap:6px}.composer:focus-within{border-color:#413f68;box-shadow:0 0 0 1px #413f68}.composer textarea{display:block;flex:1;min-width:0;resize:none;min-height:36px;max-height:100px;border:0;outline:none;padding:7px 5px;color:#393749;background:transparent;font-size:14px;line-height:1.5}.composer textarea::placeholder{color:#93909f}.send{display:grid;place-items:center;min-width:38px;height:36px;padding:0 7px;border:0;border-radius:3px;background:#f3ff0f;color:#413f68;font-size:12px;font-weight:700}.send:disabled{opacity:.4}.note{font-size:10px;line-height:1.6;color:#8d899b;text-align:center;margin:8px 0 0}.footline{display:flex;justify-content:center;gap:5px}.error-label{font-size:11px;color:#9a6340}
      @media(max-width:650px){:host{right:12px;bottom:max(12px,env(safe-area-inset-bottom));left:auto}.launcher{min-height:58px;padding:9px 15px 9px 10px;gap:9px}.launcher strong{font-size:13px}.launcher small{font-size:9px}.launcher-icon{width:36px;height:36px}.panel{width:calc(100vw - 24px);height:min(650px,calc(100dvh - 24px - env(safe-area-inset-bottom)));max-height:var(--chat-viewport,90dvh)}.header{padding:15px 16px}.header h2{font-size:17px}.messages{padding:17px 14px 10px}.composer textarea{font-size:16px}.actions{padding:10px 14px}.composer-wrap{padding:0 14px 12px}.text{font-size:14px}.question{font-size:12px}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    </style>
    <button class="launcher" aria-expanded="false" aria-controls="chat-panel" aria-label="AI採用相談を開く">
      <span class="launcher-icon">${bubble}</span><span><small>RECRUIT ASSISTANT</small><strong>採用について相談する</strong></span>
    </button>
    <section id="chat-panel" class="panel" role="dialog" aria-label="豊栄物流 AI採用相談" hidden>
      <header class="header"><span class="header-icon">${bubble}</span><div class="header-copy"><span class="eyebrow">HOUEI / RECRUIT ASSISTANT</span><h2>AI採用相談</h2></div><button class="close" aria-label="チャットを閉じる"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6"/></svg></button></header>
      <div class="intro-label">応募する前に、気になることを。</div>
      <div class="messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label="相談の会話">
        <div class="message"><div class="byline"><span class="mark">AI</span>豊栄物流 採用アシスタント</div><div class="text">こんにちは。豊栄物流のAI採用アシスタントです。\n仕事内容や免許の取得支援、職場見学など、気になることをお気軽にお聞きください。</div><p class="suggest-label">例えば、こんなことを聞けます</p><div class="questions"><button class="question">未経験でも大丈夫？</button><button class="question">大型免許がなくても応募できる？</button><button class="question">給与や休日を知りたい</button><button class="question">職場を見学できますか？</button></div></div>
      </div>
      <nav class="actions" aria-label="採用情報へのリンク"><a class="action" href="/recruit.html#requirement">募集要項を見る</a><a class="action primary" href="https://houei-butsuryu.co.jp/contact.html" target="_blank" rel="noopener noreferrer">見学・応募を相談する</a></nav>
      <div class="composer-wrap"><form class="composer"><textarea rows="1" maxlength="600" aria-label="採用についての質問" placeholder="気になることを入力…" required></textarea><button class="send" type="submit" aria-label="質問を送信" disabled>送信</button></form><p class="note">AIの回答は公開情報に基づきます。最新条件は担当者へ。<br>試用版：このチャットで応募・予約は確定しません。</p></div>
    </section>`;

  const $ = s => root.querySelector(s);
  const panel = $('.panel'), launcher = $('.launcher'), messages = $('.messages'), input = $('textarea'), send = $('.send');
  let busy = false;
  let history = [];
  let composing = false;
  let opened = false;
  function open() {
    opened = true;
    panel.hidden = false;
    launcher.hidden = true;
    launcher.setAttribute('aria-expanded','true');
    $('.close').focus({preventScroll:true});
    resize();
  }
  function close() {
    opened = false;
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded','false');
    launcher.focus({preventScroll:true});
  }
  launcher.addEventListener('click',open);
  $('.close').addEventListener('click',close);
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
  function resize() {
    if (window.visualViewport && innerWidth <= 650) {
      host.style.setProperty('--chat-viewport',`${Math.max(230,window.visualViewport.height-24)}px`);
      host.style.bottom = `${Math.max(12,innerHeight-window.visualViewport.height-window.visualViewport.offsetTop+12)}px`;
    } else host.style.bottom='';
  }
  window.visualViewport?.addEventListener('resize',resize);
  window.addEventListener('resize',resize);
  function scroll() { messages.scrollTop = messages.scrollHeight; }
  function append(role,text) {
    const div = document.createElement('div');
    div.className = `message ${role==='user'?'user':''}`;
    const by = document.createElement('div'); by.className='byline';
    by.textContent=role==='user'?'あなた':'豊栄物流 採用アシスタント';
    const content=document.createElement('div'); content.className='text'; content.textContent=text;
    div.append(by,content);messages.append(div);scroll();return div;
  }
  function setBusy(value) {
    busy=value; send.disabled=value||!input.value.trim();
    root.querySelectorAll('.question').forEach(b=>b.disabled=value);
    panel.setAttribute('aria-busy',String(value));
  }
  async function ask(question,retry=false) {
    if (busy||!question.trim()) return;
    if (!retry) append('user',question);
    setBusy(true);input.value='';input.style.height='auto';
    const pending=append('assistant','');pending.classList.add('pending');
    pending.querySelector('.text').innerHTML='<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>採用情報を確認しています…</span>';
    const slow=setTimeout(()=>{const span=pending.querySelector('.text > span:last-child');if(span)span.textContent='回答をまとめています。もう少しお待ちください…';},15000);
    try {
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,history}),signal:AbortSignal.timeout(125000)});
      const data=await response.json();
      if(!response.ok||!data.answer)throw new Error(data.error||'回答を取得できませんでした。もう一度お試しください。');
      pending.remove();
      const result=append('assistant',data.answer);
      const link=document.createElement('a');link.className='source';link.href='https://houei-butsuryu.co.jp/recruit.html';link.target='_blank';link.rel='noopener noreferrer';link.textContent='参照：公式サイトの採用情報';result.append(link);
      history.push({role:'user',content:question},{role:'assistant',content:data.answer});history=history.slice(-6);
    } catch(error) {
      pending.remove();
      const result=append('assistant',error.name==='TimeoutError'?'回答に時間がかかっています。もう一度お試しいただくか、募集要項をご覧ください。':error.message);
      result.classList.add('error');const retryButton=document.createElement('button');retryButton.className='retry';retryButton.textContent='もう一度試す';retryButton.addEventListener('click',()=>{result.remove();ask(question,true);});result.append(retryButton);
    } finally { clearTimeout(slow);setBusy(false);scroll(); }
  }
  $('.composer').addEventListener('submit',e=>{e.preventDefault();if(!composing)ask(input.value.trim());});
  input.addEventListener('input',()=>{send.disabled=busy||!input.value.trim();input.style.height='auto';input.style.height=`${Math.min(100,input.scrollHeight)}px`;});
  input.addEventListener('compositionstart',()=>composing=true);
  input.addEventListener('compositionend',()=>composing=false);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!composing){e.preventDefault();ask(input.value.trim());}});
  root.querySelectorAll('.question').forEach(b=>b.addEventListener('click',()=>ask(b.textContent)));
  // Preserve the source form's appearance but never send test data to the company.
  document.querySelectorAll('form[data-preview-form]').forEach(form=>{
    const previewNotice=e=>{
      e.preventDefault();
      let note=form.querySelector('[data-demo-note]');
      if(!note){note=document.createElement('p');note.dataset.demoNote='true';note.setAttribute('role','status');note.style.cssText='margin-top:20px;padding:18px;background:#f3ff0f;color:#413f68;font-size:15px;line-height:1.8';form.append(note);}
      note.textContent='こちらはプレビューです。入力内容は送信されていません。実際のご相談は公式サイトのお問い合わせフォームをご利用ください。';
      note.scrollIntoView({behavior:'smooth',block:'center'});
    };
    form.addEventListener('submit',previewNotice);
    form.querySelector('button[type="submit"]')?.addEventListener('click',previewNotice);
  });
})();
