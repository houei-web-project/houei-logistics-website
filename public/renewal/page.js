(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  function closeMenu() { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','メニューを開く'); }
  toggle.addEventListener('click',()=>{
    const opened = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded',String(opened));
    toggle.setAttribute('aria-label',opened?'メニューを閉じる':'メニューを開く');
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){closeMenu();toggle.focus();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});

  // Extend the existing assistant only on this page; the original stays untouched.
  const chat = document.querySelector('houei-recruit-chat')?.shadowRoot;
  if (!chat) return;
  const theme = document.createElement('link');
  theme.rel='stylesheet';theme.href='/renewal/chat-theme.css';chat.append(theme);
  const launcher = chat.querySelector('.launcher');
  launcher.querySelector('small').textContent='LET’S TALK ABOUT YOUR FUTURE';
  launcher.querySelector('strong').textContent='お仕事のこと、聞いてみませんか？';
  chat.querySelector('.header h2').textContent='おしごと相談室';
  chat.querySelector('.eyebrow').textContent='HOUEI / AI RECRUIT ASSISTANT';
  const jobs = chat.querySelector('.action:not(.primary)');
  jobs.href='#jobs';
  jobs.addEventListener('click',()=>chat.querySelector('.close').click());
  document.querySelectorAll('[data-open-chat]').forEach(button=>button.addEventListener('click',()=>{
    closeMenu();
    if(chat.querySelector('.panel').hidden) launcher.click();
    chat.querySelector('textarea').focus({preventScroll:true});
  }));
})();
