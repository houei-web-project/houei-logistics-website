(() => {
  'use strict';

  document.querySelectorAll('[data-print]').forEach(button => {
    button.addEventListener('click', () => window.print());
  });

  const printDetails = [...document.querySelectorAll('.price-details')];
  let printState = null;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = printDetails.map(detail => detail.open);
    printDetails.forEach(detail => { detail.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    printDetails.forEach((detail, index) => { detail.open = printState[index]; });
    printState = null;
  });

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
    menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', () => setMenu(false));
  }

  const sections = [...document.querySelectorAll('[data-section]')];
  const links = [...document.querySelectorAll('#proposal-nav a[href^="#"]')];
  const markCurrent = id => {
    links.forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  links.forEach(link => link.addEventListener('click', () => markCurrent(link.hash.slice(1))));
  if ('IntersectionObserver' in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      const current = sections.find(section => visible.has(section));
      if (current) markCurrent(current.id);
    }, { rootMargin: '-15% 0px -50% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }
})();
