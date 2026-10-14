(() => {
  'use strict';

  const faqItems = [
    {
      id: 'experience',
      question: '未経験でも大丈夫？',
      answer: '未経験の方も歓迎されています。先輩社員が同乗し、運転や搬入の方法を指導する体制が紹介されています。初めての大型車の仕事で気になる点も、採用担当へ相談できます。',
    },
    {
      id: 'license',
      question: '免許取得の支援はある？',
      answer: '大型免許がない方も、会社負担で免許を取得できる制度が掲載されています。フォークリフト資格の取得支援もあります。支援を受ける条件や、現在お持ちの免許で応募できるかは、採用担当への確認が必要です。',
    },
    {
      id: 'salary',
      question: '給与・待遇を知りたい',
      answer: '掲載されている正社員・大型ドライバーの月給は28万〜32万円です。賞与年2回、交通費規定支給、各種手当、社会保険完備などの記載があります。給与の内訳・手取り・現在の募集条件は、採用担当にご確認ください。',
    },
    {
      id: 'holidays',
      question: '休日・休暇を知りたい',
      answer: '募集要項の休日は「土曜（隔週）・日曜・祝日・その他」です。年末年始・お盆・GW・有休についても記載があります。毎週土日休みとは限らないため、具体的な勤務カレンダーは採用担当にご確認ください。',
    },
    {
      id: 'hours',
      question: '勤務時間・残業は？',
      answer: '地場と長距離の輸送があり、拘束時間の短縮に取り組んでいると紹介されています。具体的な勤務時間・残業・夜勤・帰宅頻度は公開情報では分かりません。ご希望の働き方を採用担当に相談するのがおすすめです。',
    },
    {
      id: 'job',
      question: 'どんな仕事ですか？',
      answer: '大型ドライバーとして、地場や長距離の輸送配送を行う仕事です。扱う荷物は建築資材・段ボール・原料・機械物など。積み込みは主にパレット物をフォークリフトで行うと掲載されています。担当する車両やルートは採用担当にご確認ください。',
    },
    {
      id: 'location',
      question: '勤務地はどこ？',
      answer: '募集要項の勤務地は三重県亀山市野村町です。会社所在地は「三重県亀山市野村町1789番地の90」です。通勤について気になることがあれば、採用担当へご相談ください。',
    },
    {
      id: 'visit',
      question: '職場を見学できますか？',
      answer: '職場見学を受け付けていると紹介されています。まずは雰囲気を見てみたい方も、公式お問い合わせで「採用について」を選んで相談できます。見学日時は担当者との調整が必要です。このチャットでは予約は確定しません。',
    },
    {
      id: 'apply',
      question: '応募方法を知りたい',
      answer: '採用の流れは「応募 → 面接 → 内定 → 入社」です。下の「見学・応募を相談する」から公式お問い合わせへ進み、「採用について」を選んでご連絡ください。お電話は0595-82-3011、窓口は9:00〜17:00（土日祝・GW・夏季・年末年始を除く）です。',
    },
    {
      id: 'women',
      question: '女性も応募できますか？',
      answer: '採用ページには、女性ドライバーも歓迎すると記載されています。具体的な設備や配属については公開情報だけでは分からないため、採用担当にご確認ください。',
    },
    {
      id: 'age',
      question: '年齢の条件はありますか？',
      answer: '年齢条件は、掲載情報に「59歳迄」と「年齢不問」の両方の記載があるため、この場では応募可否をお答えできません。現在の募集条件を採用担当へご確認ください。公式のお問い合わせで「採用について」を選ぶと相談できます。',
    },
  ];
  const faqById = new Map(faqItems.map(item => [item.id, item]));
  const sourceUrl = 'https://houei-butsuryu.co.jp/recruit.html';

  const host = document.createElement('houei-recruit-chat');
  document.body.append(host);
  const root = host.attachShadow({mode: 'open'});
  const bubble = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 10h8M7 14h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  root.innerHTML = `
    <style>
      :host{position:fixed;right:24px;bottom:24px;z-index:2147483000;font-family:'Zen Kaku Gothic Antique',sans-serif;font-size:16px;line-height:1.65;color:#413f68;text-align:left;letter-spacing:0;box-sizing:border-box}
      *,*::before,*::after{box-sizing:border-box}button{font:inherit;cursor:pointer}button,a{-webkit-tap-highlight-color:transparent}button:focus-visible,a:focus-visible,[tabindex]:focus-visible{outline:3px solid #aaa4e0;outline-offset:3px}[hidden]{display:none!important}svg{width:24px;height:24px;flex-shrink:0}a{color:inherit}
      .launcher{display:flex;align-items:center;gap:13px;min-height:68px;background:#413f68;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:11px 22px 11px 14px;box-shadow:0 8px 32px #25213e35;text-align:left;transition:transform .2s,box-shadow .2s}
      .launcher:hover{transform:translateY(-3px);box-shadow:0 12px 34px #25213e4a}.launcher-icon{display:grid;place-items:center;width:43px;height:43px;background:#f3ff0f;color:#413f68;border-radius:50%}.launcher strong{display:block;font-size:15px;font-weight:700;letter-spacing:.05em}.launcher small{display:block;font-family:Montserrat,sans-serif;font-size:10px;letter-spacing:.15em;color:#f3ff0f;line-height:1.6}
      .panel{width:410px;height:min(660px,calc(100dvh - 48px));display:flex;flex-direction:column;background:#fafafa;border:1px solid #413f6825;border-radius:10px;box-shadow:0 18px 65px #17152640;overflow:hidden;animation:enter .22s ease-out}
      @keyframes enter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .header{display:flex;align-items:center;gap:12px;background:#413f68;color:#fff;padding:19px 20px 18px;flex-shrink:0}.header-icon{color:#f3ff0f}.header-copy{flex:1}.eyebrow{display:block;color:#f3ff0f;font-family:Montserrat,sans-serif;font-size:10px;letter-spacing:.17em;line-height:1.5}.header h2{font-size:18px;margin:3px 0 0;font-weight:700;letter-spacing:.04em}.close{display:grid;place-items:center;width:34px;height:34px;border:1px solid #ffffff38;border-radius:50%;background:transparent;color:#fff}.close:hover{background:#ffffff16}.close svg{width:17px;height:17px}
      .intro-label{padding:9px 18px;background:#f3ff0f;font-size:12px;color:#413f68;font-weight:700;letter-spacing:.025em;text-align:center;flex-shrink:0}
      .messages{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:20px 18px;scrollbar-width:thin;scrollbar-color:#d5d4de transparent}.byline{font-size:11px;letter-spacing:.04em;margin:0 0 7px;color:#69677e}.message{margin-bottom:18px}.text{padding:14px 16px;border:1px solid #e5e4eb;background:#fff;border-radius:0 10px 10px 10px;color:#393749;font-size:14px;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere}.user{margin-left:36px}.user .text{background:#eeedf5;color:#413f68;border-color:#e1dfed;border-radius:10px 0 10px 10px}.user .byline{text-align:right}.source{display:inline-block;font-size:11px;color:#7b788f;margin:9px 0 0 4px;text-decoration:underline;text-underline-offset:3px}.questions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.question{display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0;min-height:50px;border:1px solid #ceccd9;color:#413f68;background:#fff;padding:11px 12px;border-radius:4px;font-size:12px;text-align:left;line-height:1.6;overflow-wrap:anywhere;transition:background .15s}.question::after{content:'›';font-size:18px;line-height:1;flex-shrink:0}.question:hover{background:#f3ff0f;border-color:#413f68}.reset-questions{display:block;width:100%;min-height:46px;margin-top:20px;border:1px solid #bcb8cd;border-radius:4px;padding:10px 14px;background:#fff;color:#413f68;font-size:13px;font-weight:700}.reset-questions:hover{background:#f3ff0f;border-color:#413f68}
      .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 18px;flex-shrink:0;border-top:1px solid #e8e7ee}.action{display:block;text-decoration:none;text-align:center;font-size:12px;font-weight:700;line-height:1.5;padding:10px 5px;border:1px solid #d7d5e1;border-radius:4px;background:#fff}.action:hover{background:#f3ff0f}.action.primary{border-color:#413f68;background:#413f68;color:#fff}.action.primary:hover{background:#56527e}.note{font-size:10px;line-height:1.7;color:#8d899b;text-align:center;margin:0;padding:0 18px 14px;flex-shrink:0}
      @media(max-width:650px){:host{right:12px;left:12px;width:auto;bottom:max(12px,env(safe-area-inset-bottom))}.launcher{margin-left:auto;min-height:58px;padding:9px 15px 9px 10px;gap:9px}.launcher strong{font-size:13px}.launcher small{font-size:9px}.launcher-icon{width:36px;height:36px}.panel{width:100%;height:min(650px,calc(100dvh - 24px - env(safe-area-inset-bottom)));max-height:var(--chat-viewport,90dvh)}.header{padding:15px 16px}.header h2{font-size:17px}.messages{padding:17px 14px}.actions{padding:10px 14px}.text{font-size:14px}.question{font-size:12px;padding:10px;min-height:50px}.note{padding:0 14px 12px}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    </style>
    <button class="launcher" type="button" aria-expanded="false" aria-controls="chat-panel" aria-label="採用Q&Aを開く">
      <span class="launcher-icon">${bubble}</span><span><small>RECRUIT Q&amp;A</small><strong>採用Q&amp;A</strong></span>
    </button>
    <section id="chat-panel" class="panel" role="dialog" aria-label="豊栄物流 採用について" hidden>
      <header class="header"><span class="header-icon">${bubble}</span><div class="header-copy"><span class="eyebrow">HOUEI / RECRUIT Q&amp;A</span><h2>採用について</h2></div><button class="close" type="button" aria-label="採用Q&Aを閉じる"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6"/></svg></button></header>
      <div class="intro-label">知りたいことを選んでください。</div>
      <div class="messages" role="region" aria-live="polite" aria-relevant="additions text" aria-label="採用Q&Aの回答"></div>
      <nav class="actions" aria-label="採用情報へのリンク"><a class="action" href="/recruit.html#requirement">募集要項を見る</a><a class="action primary" href="https://houei-butsuryu.co.jp/contact.html" target="_blank" rel="noopener noreferrer">見学・応募を相談する</a></nav>
      <p class="note">最新の募集条件は採用担当へ。<br>ここでは応募・予約は確定しません。</p>
    </section>`;

  const panel = root.querySelector('.panel');
  const launcher = root.querySelector('.launcher');
  const messages = root.querySelector('.messages');
  let selectedId = null;
  let returnFocus = launcher;

  function renderQuestions(focus = false) {
    const questions = document.createElement('div');
    questions.className = 'questions';
    questions.setAttribute('role', 'group');
    questions.setAttribute('aria-label', '質問を選んで確認');
    faqItems.forEach(item => {
      const button = document.createElement('button');
      button.className = 'question';
      button.type = 'button';
      button.dataset.questionId = item.id;
      button.textContent = item.question;
      button.addEventListener('click', () => renderAnswer(item.id));
      questions.append(button);
    });
    messages.replaceChildren(questions);
    messages.scrollTop = 0;
    if (focus) {
      const target = questions.querySelector(`[data-question-id="${selectedId}"]`) || questions.querySelector('button');
      target.focus({preventScroll: true});
      target.scrollIntoView({block: 'nearest'});
    }
  }

  function createMessage(role, text) {
    const message = document.createElement('div');
    message.className = `message ${role}`;
    const byline = document.createElement('div');
    byline.className = 'byline';
    byline.textContent = role === 'user' ? '選んだ質問' : '豊栄物流 採用Q&A';
    const content = document.createElement('div');
    content.className = 'text';
    content.textContent = text;
    message.append(byline, content);
    return message;
  }

  function renderAnswer(id) {
    const item = faqById.get(id);
    if (!item) return;
    selectedId = id;
    const question = createMessage('user', item.question);
    const answer = createMessage('assistant', item.answer);
    answer.dataset.answerId = id;
    answer.tabIndex = -1;
    const source = document.createElement('a');
    source.className = 'source';
    source.href = sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = '参照：公式サイトの採用情報';
    answer.append(source);
    const reset = document.createElement('button');
    reset.className = 'reset-questions';
    reset.type = 'button';
    reset.dataset.resetQuestions = '';
    reset.textContent = 'ほかの質問を見る';
    reset.addEventListener('click', () => renderQuestions(true));
    messages.replaceChildren(question, answer, reset);
    messages.scrollTop = 0;
    answer.focus({preventScroll: true});
  }

  function open() {
    const active = document.activeElement === host ? root.activeElement : document.activeElement;
    returnFocus = active instanceof HTMLElement && active !== document.body && active !== document.documentElement && !panel.contains(active) ? active : launcher;
    renderQuestions();
    panel.hidden = false;
    launcher.hidden = true;
    launcher.setAttribute('aria-expanded', 'true');
    resize();
    messages.querySelector('[data-question-id]').focus({preventScroll: true});
  }

  function close() {
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded', 'false');
    (returnFocus?.isConnected ? returnFocus : launcher).focus({preventScroll: true});
  }

  function resize() {
    if (window.visualViewport && innerWidth <= 650) {
      host.style.setProperty('--chat-viewport', `${Math.max(230, window.visualViewport.height - 24)}px`);
      host.style.bottom = `${Math.max(12, innerHeight - window.visualViewport.height - window.visualViewport.offsetTop + 12)}px`;
    } else {
      host.style.bottom = '';
    }
  }

  renderQuestions();
  launcher.addEventListener('click', open);
  root.querySelector('.close').addEventListener('click', close);
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      close();
    }
  });
  window.visualViewport?.addEventListener('resize', resize);
  window.addEventListener('resize', resize);

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
