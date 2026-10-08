import {cp, mkdir, copyFile, readFile, writeFile, readdir, rm} from 'node:fs/promises';
import {build} from 'esbuild';
await rm('dist', {recursive:true,force:true});
await mkdir('dist/client', {recursive:true});
await mkdir('dist/server', {recursive:true});
await mkdir('dist/.openai', {recursive:true});
await cp('public', 'dist/client', {recursive:true});
await copyFile('public/index.html', 'dist/client/original.html');
for (const name of await readdir('dist/client')) {
  if (!name.endsWith('.html')) continue;
  const file = `dist/client/${name}`;
  const html = await readFile(file,'utf8');
  await writeFile(file,html.replace('</body>','<script src="/admin-link.js" defer></script></body>'));
}
await build({entryPoints:['worker/index.mjs'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
