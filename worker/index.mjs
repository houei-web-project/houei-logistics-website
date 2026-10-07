import {handleAdmin} from './admin.mjs';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      const response = await handleAdmin(request, env);
      if (response) return response;
      if (url.pathname.startsWith('/api/')) return Response.json({error:'AIチャットは接続準備中です。'},{status:503});
      if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405});
      if (url.pathname === '/admin') return Response.redirect(url.origin+'/admin/',302);
      if (url.pathname === '/admin/') url.pathname = '/admin/index.html';
      const asset = await env.ASSETS.fetch(new Request(url, request));
      const headers = new Headers(asset.headers);
      headers.set('X-Content-Type-Options','nosniff');
      headers.set('X-Robots-Tag','noindex, nofollow');
      if (url.pathname.startsWith('/admin/')) headers.set('Cache-Control','no-store');
      return new Response(asset.body,{status:asset.status,headers});
    } catch {
      return Response.json({error:'接続できませんでした。時間をおいて再度お試しください。'},{status:503,headers:{'Cache-Control':'no-store'}});
    }
  }
};
