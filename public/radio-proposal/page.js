(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#proposal-nav');

  const setMenu = (open, returnFocus = false) => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu.classList.toggle('is-open', open);
    if (returnFocus) menuButton.focus();
  };

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        setMenu(false, true);
      }
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', () => setMenu(false));
  }

  const dialog = document.querySelector('#console-dialog');
  let previousFocus = null;

  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-console-open]').forEach((button) => {
      button.addEventListener('click', () => {
        if (dialog.open) return;
        previousFocus = document.activeElement;
        dialog.showModal();
        document.body.classList.add('dialog-open');
      });
    });
    dialog.querySelector('[data-console-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    });
  } else {
    document.querySelectorAll('[data-console-open]').forEach((button) => {
      button.addEventListener('click', () => {
        window.open(button.querySelector('img').src, '_blank', 'noopener');
      });
    });
  }

  document.querySelectorAll('[data-print]').forEach((button) => {
    button.addEventListener('click', () => window.print());
  });
})();
