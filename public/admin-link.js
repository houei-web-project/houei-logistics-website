(() => {
  const link = document.createElement('a');
  link.href = '/admin/';
  link.textContent = '⚙ Admin';
  link.setAttribute('aria-label', '管理者ログイン・採用ナレッジ管理');
  link.style.cssText = 'position:fixed;right:24px;bottom:12px;z-index:2147482999;padding:5px 12px;border:1px solid #d9ccd1;border-radius:20px;background:#fffaf8;color:#705361;font:12px/1.5 sans-serif;text-decoration:none;box-shadow:0 2px 8px #44334412';
  document.body.append(link);
  const style = document.createElement('style');
  style.textContent = 'houei-recruit-chat{transform:translateY(-34px)}';
  document.head.append(style);
})();
