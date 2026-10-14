(() => {
  'use strict';

  document.querySelector('[data-print]')?.addEventListener('click', () => {
    window.print();
  });

  const inputIds = ['before-minutes', 'after-minutes', 'daily-count', 'monthly-days'];
  const inputs = inputIds.map(id => document.getElementById(id));
  const output = document.getElementById('hours-saved');
  const direction = document.getElementById('savings-direction');
  const numberFormat = new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  function updateEstimate() {
    let invalid = false;
    const values = inputs.map(input => {
      const value = input.valueAsNumber;
      const valid = input.value.trim() !== '' && input.validity.valid && Number.isFinite(value) && Number.isInteger(value);
      if (valid) input.removeAttribute('aria-invalid');
      else input.setAttribute('aria-invalid', 'true');
      invalid ||= !valid;
      return value;
    });

    if (invalid) {
      output.textContent = '入力を確認';
      direction.textContent = '各項目を範囲内の整数で入力してください';
      return;
    }

    const [before, after, daily, days] = values;
    const minutes = (before - after) * daily * days;
    const hours = minutes === 0 ? 0 : minutes / 60;
    output.textContent = numberFormat.format(hours);
    direction.textContent = minutes < 0
      ? '時間 / 月（作業時間が増加）'
      : minutes > 0
        ? '時間 / 月の削減'
        : '時間 / 月（変化なし）';
  }

  if (output && direction && inputs.every(Boolean)) {
    inputs.forEach(input => input.addEventListener('input', updateEstimate));
    updateEstimate();
  }

  const sections = [...document.querySelectorAll('[data-section]')];
  const navLinks = [...document.querySelectorAll('.proposal-nav .nav-item')];

  function markCurrent(id) {
    navLinks.forEach(link => {
      if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => markCurrent(link.hash.slice(1)));
  });

  if ('IntersectionObserver' in window) {
    const visibleSections = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleSections.add(entry.target);
        else visibleSections.delete(entry.target);
      });
      const current = sections.find(section => visibleSections.has(section));
      if (current) markCurrent(current.id);
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }
})();
