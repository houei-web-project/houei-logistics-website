import {cp, mkdir, copyFile} from 'node:fs/promises';
await mkdir('dist', {recursive:true});
await cp('public', 'dist', {recursive:true});
await copyFile('public/index.html', 'dist/original.html');
await copyFile('public/renewal.html', 'dist/index.html');
