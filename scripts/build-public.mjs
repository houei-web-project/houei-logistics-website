import {cp, mkdir, copyFile} from 'node:fs/promises';
await mkdir('.site-public', {recursive:true});
await cp('public', '.site-public', {recursive:true});
await copyFile('public/index.html', '.site-public/original.html');
await copyFile('public/renewal.html', '.site-public/index.html');
