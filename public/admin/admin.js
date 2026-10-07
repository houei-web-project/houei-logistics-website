'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const statuses = { draft: '下書き', review: '確認待ち', approved: '承認済み' };
  const fields = ['title', 'category', 'fact', 'answer', 'status', 'sourceUrl', 'checkedAt', 'notes'];
  let items = [];
  let selectedId = null;
  let selectedVersion = null;
  let dirty = false;
  let saving = false;

  function message(id, value, error = false) {
    $(id).textContent = value;
    $(id).classList.toggle('error', error);
  }

  async function request(path, options = {}) {
    let response;
    try { response = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    }); } catch { throw new Error('通信できませんでした。接続を確認して再度お試しください。'); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const explanations = {
        400: '入力内容を確認してください。文字数や日付の形式に誤りがある可能性があります。',
        401: 'ログインの有効期限が切れています。再度ログインしてください。',
        403: 'この操作は許可されていません。管理者に確認してください。',
        404: '対象の情報が見つかりません。ページを再読み込みしてください。',
        409: '別の担当者が更新しました。最新の内容を確認してください。',
        413: '入力内容が長すぎます。文字数を減らして再度お試しください。',
        422: '入力内容を確認してください。必須項目や形式に誤りがあります。',
        429: '操作が集中しています。少し待ってから再度お試しください。',
        503: '管理機能を現在利用できません。設定状況を管理者に確認してください。',
      };
      const error = new Error(explanations[response.status] || 'サーバーで処理できませんでした。時間をおいて再度お試しください。');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function showLogin() {
    $('workspace').hidden = true;
    $('logout').hidden = true;
    $('login-panel').hidden = false;
    items = [];
    selectedId = null;
    selectedVersion = null;
    dirty = false;
    $('editor').reset();
    $('editor').hidden = true;
    $('empty-editor').hidden = false;
    $('knowledge-list').replaceChildren();
    $('answer-preview').textContent = '';
  }

  function safeSource(value) {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  function updatePreview() {
    $('answer-preview').textContent = $('answer').value || '回答を入力すると、ここに表示されます。';
    const url = safeSource($('sourceUrl').value);
    $('source-link').hidden = !url;
    if (url) $('source-link').href = url;
    else $('source-link').removeAttribute('href');
    $('edit-status').className = `badge ${$('status').value}`;
    $('edit-status').textContent = statuses[$('status').value] || '下書き';
  }

  function renderStats() {
    $('total-count').textContent = items.length;
    Object.keys(statuses).forEach((status) => {
      $(`${status}-count`).textContent = items.filter((item) => item.status === status).length;
    });
    const priorCategory = $('category-filter').value;
    $('category-filter').replaceChildren(new Option('すべてのカテゴリ', ''));
    [...new Set(items.map((item) => item.category).filter(Boolean))].sort().forEach((category) => {
      $('category-filter').add(new Option(category, category));
    });
    $('category-filter').value = priorCategory;
  }

  function renderList() {
    const query = $('search').value.trim().toLocaleLowerCase();
    const status = $('status-filter').value;
    const category = $('category-filter').value;
    const filtered = items.filter((item) => (!status || item.status === status)
      && (!category || item.category === category)
      && (!query || [item.title, item.category, item.fact, item.answer, item.notes].join(' ').toLocaleLowerCase().includes(query)));
    $('result-count').textContent = `${filtered.length} 件`;
    const fragment = document.createDocumentFragment();
    filtered.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `knowledge-card${selectedId === item.id ? ' active' : ''}`;
      button.setAttribute('aria-pressed', String(selectedId === item.id));
      const top = document.createElement('span');
      top.className = 'card-top';
      const categoryLabel = document.createElement('span');
      categoryLabel.className = 'category';
      categoryLabel.textContent = item.category || '未分類';
      const badge = document.createElement('span');
      badge.className = `badge ${Object.hasOwn(statuses, item.status) ? item.status : 'draft'}`;
      badge.textContent = statuses[item.status] || '下書き';
      top.append(categoryLabel, badge);
      const title = document.createElement('span');
      title.className = 'card-title';
      title.textContent = item.title;
      const excerpt = document.createElement('p');
      excerpt.className = 'card-excerpt';
      excerpt.textContent = item.fact || item.answer || '内容が未入力です';
      button.append(top, title, excerpt);
      button.addEventListener('click', () => selectItem(item.id));
      fragment.append(button);
    });
    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-list';
      empty.textContent = items.length ? '条件に一致する情報がありません。' : '登録されたナレッジがありません。';
      fragment.append(empty);
    }
    $('knowledge-list').replaceChildren(fragment);
  }

  function selectItem(id, force = false) {
    if (saving) return;
    if (!force && dirty && !window.confirm('保存していない変更があります。変更を破棄して別の項目を開きますか？')) return;
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    selectedId = id;
    selectedVersion = item.version;
    fields.forEach((field) => {
      $(field).value = field === 'checkedAt' ? String(item[field] || '').slice(0, 10) : (item[field] ?? '');
    });
    dirty = false;
    $('empty-editor').hidden = true;
    $('editor').hidden = false;
    updatePreview();
    message('save-message', '変更内容を確認して保存してください。');
    renderList();
    if (!force && window.matchMedia('(max-width: 700px)').matches) {
      $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function load() {
    try {
      const data = await request('/api/admin/knowledge');
      if (!Array.isArray(data.items)) throw new Error('データ形式を確認できませんでした。ページを再読み込みしてください。');
      items = data.items;
      $('login-panel').hidden = true;
      $('workspace').hidden = false;
      $('logout').hidden = false;
      message('global-message', '');
      renderStats();
      renderList();
    } catch (error) {
      if (error.status === 401) {
        showLogin();
        message('global-message', '');
      } else {
        message('global-message', `${error.message} ページを再読み込みしてお試しください。`, true);
      }
    }
  }

  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    message('login-message', '認証しています…');
    try {
      await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: $('password').value }) });
      $('password').value = '';
      message('login-message', '');
      await load();
    } catch (error) {
      message('login-message', error.status === 401 ? 'パスワードが正しくありません。' : error.message, true);
    } finally { button.disabled = false; }
  });

  $('logout').addEventListener('click', async () => {
    if (saving) return;
    if (dirty && !window.confirm('保存していない変更があります。変更を破棄してログアウトしますか？')) return;
    $('logout').disabled = true;
    try {
      await request('/api/admin/logout', { method: 'POST', body: '{}' });
      showLogin();
      message('global-message', 'ログアウトしました。');
      $('password').focus();
    } catch (error) { message('global-message', error.message, true); }
    finally { $('logout').disabled = false; }
  });

  $('editor').addEventListener('input', () => {
    dirty = true;
    updatePreview();
    message('save-message', '未保存の変更があります。');
  });

  $('editor').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving || selectedId === null) return;
    const payload = Object.fromEntries(fields.map((field) => [field, $(field).value]));
    if (payload.sourceUrl && !safeSource(payload.sourceUrl)) {
      message('save-message', '情報源URLは https:// または http:// で入力してください。', true);
      $('sourceUrl').focus();
      return;
    }
    payload.expectedVersion = selectedVersion;
    const id = selectedId;
    saving = true;
    fields.forEach((field) => { $(field).disabled = true; });
    $('save').disabled = true;
    message('save-message', '保存しています…');
    try {
      const data = await request(`/api/admin/knowledge/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
      let updated = data.item || data.knowledge || (data.id ? data : null);
      if (!updated || updated.version === undefined) {
        const fresh = await request('/api/admin/knowledge');
        updated = fresh.items?.find((item) => item.id === id);
      }
      if (!updated) throw new Error('保存結果を確認できませんでした。再読み込みして確認してください。');
      items = items.map((item) => item.id === id ? updated : item);
      saving = false;
      renderStats();
      selectItem(id, true);
      message('save-message', '保存しました。');
    } catch (error) {
      if (error.status === 401) {
        message('save-message', 'ログインの有効期限が切れています。入力内容を控え、再読み込みしてログインしてください。', true);
      } else if (error.status === 409) {
        message('save-message', '別の担当者が更新しました。入力内容を控え、ページを再読み込みして最新内容を確認してください。', true);
      } else message('save-message', error.message, true);
    } finally {
      saving = false;
      fields.forEach((field) => { $(field).disabled = false; });
      $('save').disabled = false;
    }
  });

  $('search').addEventListener('input', renderList);
  $('status-filter').addEventListener('change', renderList);
  $('category-filter').addEventListener('change', renderList);
  window.addEventListener('beforeunload', (event) => {
    if (dirty || saving) { event.preventDefault(); event.returnValue = ''; }
  });
  load();
})();
