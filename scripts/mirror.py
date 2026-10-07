"""Download the public presentation assets for an isolated client preview."""
import concurrent.futures
import hashlib
import json
import re
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
ORIGIN = 'https://houei-butsuryu.co.jp/'
PAGES = ['index.html', 'about.html', 'service.html', 'company.html', 'recruit.html', 'contact.html', 'privacy-policy.html']
MAPPING = {}
REPORT = []
UA = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

def download(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40) as response:
        return response.read(), response.headers.get_content_type()

def local_path(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.netloc == 'houei-butsuryu.co.jp':
        return parsed.path.lstrip('/') or 'index.html'
    name = Path(parsed.path).name or 'asset'
    if parsed.netloc == 'fonts.googleapis.com':
        name = 'fonts.css'
    return 'vendor/' + hashlib.sha256(url.encode()).hexdigest()[:10] + '-' + name

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ['img', 'script', 'source'] and a.get('src'):
            self.urls.append(a['src'])
        if a.get('srcset'):
            self.urls.extend(item.strip().split()[0] for item in a['srcset'].split(','))
        if tag == 'link' and any(x in a.get('rel', '') for x in ['stylesheet', 'icon', 'manifest']):
            self.urls.append(a['href'])

def eligible(url):
    return url.startswith('http') and not any(x in url for x in ['googletagmanager', 'google-analytics', '.cgi'])

def asset(url):
    body, mime = download(url)
    path = local_path(url)
    MAPPING[url] = path
    if mime == 'text/css' or path.endswith('.css'):
        css = body.decode('utf-8-sig')
        for raw in set(re.findall(r'url\([\s\'"]*([^\)\'"\s]+)', css)):
            absolute = urllib.parse.urljoin(url, raw)
            if eligible(absolute):
                child = asset(absolute)
                css = css.replace(raw, '/' + child)
        body = css.encode()
    if path.endswith('.webmanifest'):
        manifest = json.loads(body)
        for icon in manifest.get('icons', []):
            asset(urllib.parse.urljoin(url, icon['src']))
    target = PUBLIC / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(body)
    REPORT.append({'url': url, 'path': path, 'bytes': len(body)})
    return path

def main():
    documents = {}
    assets = set()
    for page in PAGES:
        url = ORIGIN if page == 'index.html' else ORIGIN + page
        html = download(url)[0].decode('utf-8-sig')
        # The preview must not write to the company's analytics or submit its form.
        html = re.sub(r'<!-- Google tag.*?</script>\s*<script>.*?</script>', '', html, flags=re.S)
        html = re.sub(r'<script\b[^>]*src=[\'"][^\'"]*\.cgi[\'"][^>]*>.*?</script>', '', html, flags=re.S)
        # Do not reuse the company's Google Maps billing key on another origin.
        if page == 'company.html':
            html = re.sub(r'<script>\s*\(g =>.*?</script>', '', html, flags=re.S)
            html = html.replace('<div id="map" class="p-company-access__photo-map"></div>', '<div id="map" class="p-company-access__photo-map"><iframe title="豊栄物流の拠点マップ" src="https://www.google.com/maps/d/embed?mid=1PBc-hFB3Rns_a5yFMdGQKMBk1vK_hjI" width="100%" height="100%" style="border:0" loading="lazy"></iframe></div>')
        parser = Assets()
        parser.feed(html)
        assets.update(urllib.parse.urljoin(url, x) for x in parser.urls if eligible(urllib.parse.urljoin(url, x)))
        documents[page] = html
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(asset, sorted(assets)))
    for page, html in documents.items():
        for url, path in sorted(MAPPING.items(), key=lambda x: -len(x[0])):
            html = html.replace(url, '/' + path)
        html = html.replace('<head>', '<head>\n    <meta name="robots" content="noindex,nofollow">')
        html = re.sub(r'action="mail/mailformpro/mailformpro.cgi"', 'action="#" data-preview-form="true"', html)
        html = html.replace('</body>', '<script src="/chat/widget.js" defer></script>\n</body>')
        (PUBLIC / page).write_text(html)
    (ROOT / 'mirror-manifest.json').write_text(json.dumps({'origin': ORIGIN, 'pages': PAGES, 'assets': sorted(REPORT, key=lambda a: a['path'])}, ensure_ascii=False, indent=2))
    js = PUBLIC / 'theme/js/script.js'
    js.write_text(js.read_text().replace('initMap();', 'if (document.getElementById("map") && window.google?.maps?.importLibrary) { initMap().catch(console.error); }'))
    print(json.dumps({'pages': len(documents), 'assets': len(REPORT), 'bytes': sum(a['bytes'] for a in REPORT)}))

if __name__ == '__main__':
    main()
