import {env} from 'cloudflare:workers';
import {cookie,digest,randomToken,safeReturn,stateCookie} from '@/lib/auth/core.mjs';
export async function GET(req:Request){
 const origin=env.SITE_URL||'https://ssrrr.net';
 if(new URL(req.url).origin!==origin)return Response.redirect(origin+'/auth/google?return_to='+encodeURIComponent(safeReturn(new URL(req.url).searchParams.get('return_to'))),302);
 if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.DB)return new Response('구글 로그인을 준비하고 있습니다. 잠시 후 다시 시도해 주세요.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 const state=randomToken(),verifier=randomToken(),nonce=randomToken(),now=Date.now();
 const ip=await digest(req.headers.get('cf-connecting-ip')||'unknown');
 const rate=await env.DB.prepare('INSERT INTO auth_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 WHERE count<60 RETURNING count').bind(ip+':'+Math.floor(now/3600000),now+3600000).first();
 if(!rate)return new Response('잠시 후 다시 시도해 주세요.',{status:429});
 await env.DB.batch([env.DB.prepare('DELETE FROM auth_flows WHERE expires_at<?').bind(now),env.DB.prepare('DELETE FROM auth_limits WHERE expires_at<?').bind(now),env.DB.prepare('INSERT INTO auth_flows(state_hash,verifier,nonce,return_to,expires_at) VALUES(?,?,?,?,?)').bind(await digest(state),verifier,nonce,safeReturn(new URL(req.url).searchParams.get('return_to')),now+600000)]);
 const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');target.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:origin+'/auth/google/callback',response_type:'code',scope:'openid email profile',state,nonce,code_challenge:await digest(verifier),code_challenge_method:'S256',prompt:'select_account'}).toString();
 return new Response(null,{status:302,headers:{Location:target.href,'Set-Cookie':cookie(stateCookie,state,600),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
