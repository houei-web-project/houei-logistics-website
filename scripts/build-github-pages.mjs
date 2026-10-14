import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {dirname, extname, relative, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const DEFAULT_BASE_PATH = '/houei-logistics-website/';
export const DEFAULT_ADMIN_URL = 'https://houei-web-project.github.io/houei-logistics-website/sitemap/';

export function normalizeBasePath(value = DEFAULT_BASE_PATH) {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*\/?$/.test(value)) {
    throw new Error('PAGES_BASE_PATH must be a root-relative path such as /houei-logistics-website/.');
  }
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeAdminUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('PAGES_ADMIN_URL must be an HTTPS URL without credentials, a query, or a fragment.');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

export function createUrlRewriter(basePath = DEFAULT_BASE_PATH, adminUrl = DEFAULT_ADMIN_URL) {
  const base = normalizeBasePath(basePath);
  const admin = normalizeAdminUrl(adminUrl);
  return url => {
    if (!url.startsWith('/') || url.startsWith('//')) return url;
    if (/^\/admin(?:\/|[?#]|$)/.test(url)) {
      return new URL(url.replace(/^\/admin\/?/, ''), admin).href;
    }
    if (base === '/' || url.startsWith(base)) return url;
    return `${base}${url.slice(1)}`;
  };
}

function rewriteCss(source, rewriteUrl) {
  return source.replace(/(url\(\s*)(["']?)(\/(?!\/)[^"')\s]+)\2(\s*\))/gi,
    (_, start, quote, url, end) => `${start}${quote}${rewriteUrl(url)}${quote}${end}`);
}

export function rewriteHtml(source, rewriteUrl) {
  let result = source.replace(/(\b(?:href|src|action|poster)\s*=\s*)(["'])(\/(?!\/)[^"']*)\2/gi,
    (_, start, quote, url) => `${start}${quote}${rewriteUrl(url)}${quote}`);
  result = result.replace(/(\bsrcset\s*=\s*)(["'])([\s\S]*?)\2/gi, (_, start, quote, candidates) => {
    const rewritten = candidates.replace(/(^|,\s*)(\/(?!\/)[^,\s]+)/g,
      (_, separator, url) => `${separator}${rewriteUrl(url)}`);
    return `${start}${quote}${rewritten}${quote}`;
  });
  return rewriteCss(result, rewriteUrl);
}

function rewriteJavaScript(source, rewriteUrl) {
  return rewriteCss(source.replace(/(["'`])(\/(?!\/)[^"'`\s]*)\1/g,
    (_, quote, url) => `${quote}${rewriteUrl(url)}${quote}`), rewriteUrl);
}

async function* filesIn(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) yield* filesIn(path);
    else if (entry.isFile()) yield path;
  }
}

export async function buildGitHubPages({
  sourceDir = resolve(projectRoot, 'public'),
  outputDir = resolve(projectRoot, 'dist/pages'),
  basePath = process.env.PAGES_BASE_PATH || DEFAULT_BASE_PATH,
  adminUrl = process.env.PAGES_ADMIN_URL || DEFAULT_ADMIN_URL,
} = {}) {
  sourceDir = resolve(sourceDir);
  outputDir = resolve(outputDir);
  const sourceFromOutput = relative(outputDir, sourceDir);
  const outputFromSource = relative(sourceDir, outputDir);
  if (!sourceFromOutput || !sourceFromOutput.startsWith(`..${sep}`) || !outputFromSource.startsWith(`..${sep}`)) {
    throw new Error('Source and output directories must be separate, without nesting.');
  }
  const base = normalizeBasePath(basePath);
  const admin = normalizeAdminUrl(adminUrl);
  const rewriteUrl = createUrlRewriter(base, admin);
  await rm(outputDir, {recursive: true, force: true});
  await mkdir(outputDir, {recursive: true});
  await cp(sourceDir, outputDir, {
    recursive: true,
    dereference: true,
    filter: path => {
      const local = relative(sourceDir, path).split(sep).join('/');
      return local !== 'admin' && !local.startsWith('admin/');
    },
  });

  for await (const file of filesIn(outputDir)) {
    const local = relative(outputDir, file).split(sep).join('/');
    const extension = extname(file);
    if (!['.html', '.css', '.js', '.webmanifest'].includes(extension)) continue;
    if (local.startsWith('vendor/') && extension === '.js') continue;
    let source = await readFile(file, 'utf8');

    if (extension === '.html') {
      source = source.replace(/(<a\b[^>]*\bhref=["'])\/admin\/?(["'][^>]*>)([\s\S]*?)(<\/a>)/gi,
        '$1/admin/$2$3<span>（別サービス）</span>$4');
      if (!source.includes('name="robots"')) {
        source = source.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n</head>');
      }
      source = rewriteHtml(source, rewriteUrl);
    } else if (extension === '.css') {
      source = rewriteCss(source, rewriteUrl);
    } else if (extension === '.js') {
      if (local === 'admin-link.js') {
        source = source.replace("'⚙ Admin'", "'⚙ Admin（別サービス）'")
          .replace('管理者ログイン・採用ナレッジ管理', '管理者ログイン・採用ナレッジ管理（別サービス）');
      }
      source = rewriteJavaScript(source, rewriteUrl);
    } else {
      const manifest = JSON.parse(source, (_, value) => typeof value === 'string' ? rewriteUrl(value) : value);
      source = `${JSON.stringify(manifest, null, 2)}\n`;
    }
    await writeFile(file, source);
  }

  for (const page of ['proposal', 'radio-proposal', 'renewal', 'sitemap']) {
    const destination = resolve(outputDir, page, 'index.html');
    await mkdir(dirname(destination), {recursive: true});
    await writeFile(destination, await readFile(resolve(outputDir, `${page}.html`)));
  }
  await writeFile(resolve(outputDir, 'original.html'), await readFile(resolve(outputDir, 'index.html')));
  await writeFile(resolve(outputDir, '.nojekyll'), '');
  return {outputDir, basePath: base, adminUrl: admin};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await buildGitHubPages();
  console.log(`GitHub Pages artifact: ${result.outputDir} (base: ${result.basePath})`);
}
