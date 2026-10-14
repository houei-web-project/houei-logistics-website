import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {extname, join, relative, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {
  buildGitHubPages, createUrlRewriter, DEFAULT_ADMIN_URL, DEFAULT_BASE_PATH,
  normalizeBasePath, rewriteHtml,
} from '../scripts/build-github-pages.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://houei-web-project.github.io';

test('Pages base path accepts subpaths and rejects origins or traversal', () => {
  assert.equal(normalizeBasePath('/houei-logistics-website'), DEFAULT_BASE_PATH);
  assert.equal(normalizeBasePath('/'), '/');
  assert.equal(normalizeBasePath('/preview/site/'), '/preview/site/');
  for (const invalid of ['', 'https://example.com/', '//example.com/', '/../public/', '/bad?query/']) {
    assert.throws(() => normalizeBasePath(invalid));
  }
});

test('URL rewriting preserves external URLs, hashes, query strings and existing prefixes', () => {
  const rewrite = createUrlRewriter();
  assert.equal(rewrite('/'), DEFAULT_BASE_PATH);
  assert.equal(rewrite('/theme/style.css?v=2#example'), `${DEFAULT_BASE_PATH}theme/style.css?v=2#example`);
  assert.equal(rewrite(`${DEFAULT_BASE_PATH}proposal/`), `${DEFAULT_BASE_PATH}proposal/`);
  assert.equal(rewrite('/admin/'), DEFAULT_ADMIN_URL);
  assert.equal(rewrite('/admin'), DEFAULT_ADMIN_URL);
  assert.equal(rewrite('/admin/?view=knowledge'), `${DEFAULT_ADMIN_URL}?view=knowledge`);
  for (const value of ['#pilot', 'theme/style.css', 'https://example.com/path', '//cdn.example.com/file.js', 'data:image/svg+xml;base64,AA==']) {
    assert.equal(rewrite(value), value);
  }
  assert.equal(createUrlRewriter('/')('/theme/image.jpg'), '/theme/image.jpg');
  assert.throws(() => createUrlRewriter('/site/', 'http://example.com/admin/'));
});

test('HTML paths and srcset use the project base without changing content or external links', () => {
  const source = '<a href="#pilot">/ unchanged text</a><a href="//example.com/path">External</a>'
    + '<img src="/image.jpg" srcset="/image.jpg 1x, /image@2x.jpg 2x">'
    + '<div style="background:url(\'/image.jpg\')"></div>';
  const result = rewriteHtml(source, createUrlRewriter('/site/'));
  assert.match(result, /href="#pilot">\/ unchanged text/);
  assert.match(result, /href="\/\/example\.com\/path"/);
  assert.match(result, /srcset="\/site\/image\.jpg 1x, \/site\/image@2x\.jpg 2x"/);
  assert.match(result, /url\('\/site\/image\.jpg'\)/);
});

async function* filesIn(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* filesIn(path);
    else if (entry.isFile()) yield path;
  }
}

function runPublicWidget(source, hostname = 'houei-web-project.github.io', search = '') {
  let activeElement;
  class Node {
    constructor(tag = 'div') {
      this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {};
      this.events = new Map(); this.style = {setProperty() {}};
      this.hidden = false; this.isConnected = true; this.className = ''; this.textContent = '';
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(name, callback) { this.events.set(name, callback); }
    click() { this.events.get('click')?.({target: this}); }
    focus() { activeElement = this; }
    scrollIntoView() {}
    contains(node) { return this === node || this.children.some(child => child.contains(node)); }
    matches(selector) {
      if (selector === '[data-question-id]') return 'questionId' in this.dataset;
      if (selector === '[data-reset-questions]') return 'resetQuestions' in this.dataset;
      const question = selector.match(/^\[data-question-id="([^"\]]+)"\]$/);
      if (question) return this.dataset.questionId === question[1];
      if (selector.startsWith('.')) return selector.slice(1).split('.').every(c => this.className.split(' ').includes(c));
      return this.tagName === selector;
    }
    querySelectorAll(selector) {
      return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  const root = new Node();
  const panel = new Node('section'); panel.className = 'panel'; panel.hidden = true;
  const launcher = new Node('button'); launcher.className = 'launcher';
  const messages = new Node(); messages.className = 'messages';
  const close = new Node('button'); close.className = 'close';
  panel.append(messages, close); root.append(panel, launcher);
  const host = new Node('houei-recruit-chat'); host.attachShadow = () => root;
  let requests = 0;
  const context = {
    HTMLElement: Node,
    document: {createElement: tag => tag === 'houei-recruit-chat' ? host : new Node(tag), body: new Node(), querySelectorAll: () => [], get activeElement() { return activeElement; }},
    window: {location: {hostname, search, href: `https://${hostname}/${search}`}, addEventListener() {}},
    fetch() { requests++; throw new Error('The selection FAQ must not call an API.'); },
  };
  vm.runInNewContext(source, context);
  assert.doesNotMatch(source, /\bfetch\s*\(|\bimport\s*\(|<textarea|class="send"|semantic-demo\.mjs|requestPublicDemo/);
  assert.equal(messages.querySelectorAll('[data-question-id]').length, 11);
  activeElement = launcher;
  launcher.click();
  assert.equal(panel.hidden, false);
  assert.equal(launcher.hidden, true);
  assert.equal(launcher.attributes['aria-expanded'], 'true');
  assert.equal(activeElement.dataset.questionId, 'experience');
  const expected = {
    experience: '先輩社員が同乗', license: '会社負担', salary: '28万〜32万円',
    holidays: '土曜（隔週）', hours: '具体的な勤務時間', job: 'パレット物',
    location: '1789番地の90', visit: '予約は確定しません', apply: '0595-82-3011',
    women: '女性ドライバーも歓迎', age: '「59歳迄」と「年齢不問」',
  };
  for (const [id, phrase] of Object.entries(expected)) {
    const button = messages.querySelector(`[data-question-id="${id}"]`);
    assert.ok(button, `Missing question ${id}`);
    button.click(); // Assert before any promise or timer can settle: the answer is synchronous.
    const answer = messages.querySelector('.message.assistant');
    assert.equal(answer.dataset.answerId, id);
    assert.ok(answer.querySelector('.text').textContent.includes(phrase), `Wrong answer for ${id}`);
    assert.equal(activeElement, answer);
    assert.equal(answer.querySelector('.source').href, 'https://houei-butsuryu.co.jp/recruit.html');
    assert.equal(messages.querySelector('.message.user').querySelector('.text').textContent, button.textContent);
    messages.querySelector('[data-reset-questions]').click();
    assert.equal(messages.querySelectorAll('[data-question-id]').length, 11);
    assert.equal(activeElement.dataset.questionId, id, 'Focus returns to the selected question');
    assert.equal(messages.querySelector('.message.assistant'), null, 'Previous answer is cleared');
  }
  let prevented = false;
  root.events.get('keydown')({key: 'Escape', preventDefault() { prevented = true; }});
  assert.equal(prevented, true);
  assert.equal(panel.hidden, true);
  assert.equal(launcher.hidden, false);
  assert.equal(activeElement, launcher);
  assert.equal(launcher.attributes['aria-expanded'], 'false');
  launcher.click(); close.click();
  assert.equal(panel.hidden, true);
  assert.equal(requests, 0);
}

test('all fixed questions answer synchronously without AI on local, browser-demo and public hosts', async () => {
  const source = await readFile(resolve(projectRoot, 'public/chat/widget.js'), 'utf8');
  for (const hostname of ['localhost', '127.0.0.1', '::1', 'houei-web-project.github.io']) {
    for (const search of ['', '?chat=browser']) runPublicWidget(source, hostname, search);
  }
});

test('static artifact includes all pages and assets without changing source', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'houei-pages-test-'));
  t.after(() => rm(temporary, {recursive: true, force: true}));
  const outputDir = join(temporary, 'pages');
  const watched = ['public/proposal.html', 'public/chat/widget.js', 'public/admin/admin.js', 'public/admin-link.js'];
  const before = await Promise.all(watched.map(file => readFile(resolve(projectRoot, file), 'utf8')));
  const built = await buildGitHubPages({outputDir, basePath: DEFAULT_BASE_PATH, adminUrl: DEFAULT_ADMIN_URL});
  assert.equal(built.basePath, DEFAULT_BASE_PATH);
  const proposal = await readFile(join(outputDir, 'proposal.html'), 'utf8');
  const renewal = await readFile(join(outputDir, 'renewal.html'), 'utf8');
  const radioProposal = await readFile(join(outputDir, 'radio-proposal.html'), 'utf8');
  assert.equal(await readFile(join(outputDir, 'proposal/index.html'), 'utf8'), proposal);
  assert.equal(await readFile(join(outputDir, 'renewal/index.html'), 'utf8'), renewal);
  assert.equal(await readFile(join(outputDir, 'radio-proposal/index.html'), 'utf8'), radioProposal);
  assert.match(radioProposal, /TLK 150/);
  assert.match(radioProposal, /href="\/houei-logistics-website\/renewal\/style\.css(?:\?[^" ]*)?"/);
  assert.match(radioProposal, /src="\/houei-logistics-website\/radio-proposal\/page\.js(?:\?[^" ]*)?"/);
  assert.match(radioProposal, /href="\/houei-logistics-website\/radio-proposal\/assets\/proposal\.pdf"/);
  assert.doesNotMatch(radioProposal, /chat\/widget\.js|admin-link\.js/);
  assert.equal(await readFile(join(outputDir, 'sitemap/index.html'), 'utf8'), await readFile(join(outputDir, 'sitemap.html'), 'utf8'));
  assert.equal(await readFile(join(outputDir, 'original.html'), 'utf8'), await readFile(join(outputDir, 'index.html'), 'utf8'));
  assert.doesNotMatch(proposal, /mastartom\.chatgpt\.site/);
  assert.match(proposal, /href="https:\/\/houei-web-project\.github\.io\/houei-logistics-website\/sitemap\/"/);
  assert.match(proposal, /href="\/houei-logistics-website\/proposal\/style\.css"/);
  assert.match(renewal, /保有車両/);
  assert.match(renewal, /10ｔウイング/);
  assert.match(renewal, /荷物に合わせて、/);
  assert.match(renewal, /大型未経験の方や女性ドライバーも歓迎しています/);
  assert.match(renewal, /about-vehcle01@2x\.jpg/);
  assert.match(renewal, /recruit-development01@2x\.jpg/);
  assert.doesNotMatch(renewal, /現行サイト|整理しました|できる仕事が見える/);
  const sitemap = await readFile(join(outputDir, 'sitemap.html'), 'utf8');
  assert.match(sitemap, /サイトマップ/);
  assert.match(sitemap, /https:\/\/houei-web-project\.github\.io\/houei-logistics-website\/proposal\//);
  assert.match(sitemap, /https:\/\/houei-web-project\.github\.io\/houei-logistics-website\/radio-proposal\//);
  assert.match(await readFile(join(outputDir, 'sitemap.xml'), 'utf8'), /https:\/\/houei-web-project\.github\.io\/houei-logistics-website\/sitemap\//);
  await stat(join(outputDir, '.nojekyll'));
  for (const excluded of ['admin', 'server', 'worker', '.env', '.openai']) {
    await assert.rejects(stat(join(outputDir, excluded)), {code: 'ENOENT'});
  }

  const adminLink = await readFile(join(outputDir, 'admin-link.js'), 'utf8');
  assert.ok(adminLink.includes(DEFAULT_ADMIN_URL));
  assert.match(adminLink, /別サービス/);
  new vm.Script(adminLink);
  const home = await readFile(join(outputDir, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /admin-link\.js/);
  const renewalScript = await readFile(join(outputDir, 'renewal/page.js'), 'utf8');
  assert.ok(renewalScript.includes(`${DEFAULT_BASE_PATH}renewal/chat-theme.css`));
  new vm.Script(renewalScript);
  const widget = await readFile(join(outputDir, 'chat/widget.js'), 'utf8');
  assert.ok(widget.includes('faqItems'));
  assert.doesNotMatch(widget, /semantic-demo\.mjs|requestPublicDemo|\/api\/chat/);
  assert.doesNotMatch(widget, /接続準備中/);
  assert.ok(widget.includes(`${DEFAULT_BASE_PATH}recruit.html#requirement`));
  runPublicWidget(widget);
  const semanticDemoPath = join(outputDir, 'chat/semantic-demo.mjs');
  await stat(semanticDemoPath);
  const semanticDemo = await import(pathToFileURL(semanticDemoPath).href);
  assert.equal(semanticDemo.source.url, 'https://houei-butsuryu.co.jp/recruit.html');
  assert.deepEqual(semanticDemo.chooseTopics([{id:'salary',score:.63},{id:'holidays',score:.59}]).map(item => item.id), ['salary','holidays']);

  const manifest = JSON.parse(await readFile(join(outputDir, 'site.webmanifest'), 'utf8'));
  assert.ok(manifest.icons.every(icon => icon.src.startsWith(DEFAULT_BASE_PATH)));
  let references = 0;
  for await (const file of filesIn(outputDir)) {
    if (!['.html', '.css', '.xml'].includes(extname(file))) continue;
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /mastartom\.chatgpt\.site/, `Unexpected ChatGPT Sites URL in ${file}`);
    const local = relative(outputDir, file).split('\\').join('/');
    const base = `${origin}${DEFAULT_BASE_PATH}${local}`;
    const urls = extname(file) === '.html'
      ? [...source.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi)].map(match => match[1])
      : [...source.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)].map(match => match[1]);
    for (const url of urls) {
      if (url.startsWith('#') || /^(?:data:|mailto:|tel:)/i.test(url)) continue;
      const resolved = new URL(url, base);
      if (resolved.origin !== origin) continue;
      assert.ok(resolved.pathname.startsWith(DEFAULT_BASE_PATH), `Escapes repository base: ${local}: ${url}`);
      const target = join(outputDir, decodeURIComponent(resolved.pathname.slice(DEFAULT_BASE_PATH.length)));
      const info = await stat(target).catch(error => { throw new Error(`Missing local target in ${local}: ${url}`, {cause: error}); });
      if (info.isDirectory()) await stat(join(target, 'index.html'));
      references++;
    }
  }
  assert.ok(references > 100, 'The complete site and font references were checked.');
  const after = await Promise.all(watched.map(file => readFile(resolve(projectRoot, file), 'utf8')));
  assert.deepEqual(after, before);
});
