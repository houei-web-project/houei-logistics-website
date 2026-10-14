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

  // Apply the renewal design to the shared recruitment Q&A.
  const chat = document.querySelector('houei-recruit-chat')?.shadowRoot;
  if (!chat) return;
  const theme = document.createElement('link');
  theme.rel='stylesheet';theme.href='/renewal/chat-theme.css?v=faq-20261015';chat.append(theme);
  const launcher = chat.querySelector('.launcher');
  launcher.querySelector('small').textContent='RECRUIT Q&A';
  launcher.querySelector('strong').textContent='採用Q&Aはこちら';
  chat.querySelector('.header h2').textContent='採用について';
  chat.querySelector('.eyebrow').textContent='HOUEI / RECRUIT Q&A';
  const jobs = chat.querySelector('.action:not(.primary)');
  jobs.href='#jobs';
  jobs.addEventListener('click',()=>chat.querySelector('.close').click());
  document.querySelectorAll('[data-open-chat]').forEach(button=>button.addEventListener('click',()=>{
    closeMenu();
    launcher.click();
    chat.querySelector('[data-question-id]')?.focus({preventScroll:true});
  }));
})();
