import {env} from 'cloudflare:workers';
import {cookie,digest,randomToken,readCookie,safeReturn,sessionCookie,stateCookie,verifyGoogleToken} from '@/lib/auth/core.mjs';
export async function GET(req:Request){
 const origin=env.SITE_URL||'https://ssrrr.net',u=new URL(req.url),h=new Headers({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});h.append('Set-Cookie',cookie(stateCookie,'',0));
 try{
  if(u.origin!==origin||!env.DB||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)throw Error('Configuration');
  const state=u.searchParams.get('state')||'',stored=readCookie(req.headers.get('cookie'),stateCookie);
  if(!/^[A-Za-z0-9_-]{43}$/.test(state)||!stored||await digest(state)!==await digest(stored))throw Error('State');
  const flow=await env.DB.prepare('DELETE FROM auth_flows WHERE state_hash=? AND expires_at>? RETURNING *').bind(await digest(state),Date.now()).first<{verifier:string;nonce:string;return_to:string}>();
  const code=u.searchParams.get('code');if(!flow||!code||code.length>4096||u.searchParams.has('error'))throw Error('Flow');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,code,code_verifier:flow.verifier,grant_type:'authorization_code',redirect_uri:origin+'/auth/google/callback'})});
  if(!response.ok)throw Error('Exchange');const data=await response.json() as {id_token?:string};if(!data.id_token)throw Error('Token');
  const identity=await verifyGoogleToken(data.id_token,env.GOOGLE_CLIENT_ID,flow.nonce);
  let user=await env.DB.prepare('SELECT owner FROM auth_users WHERE google_sub=?').bind(identity.subject).first<{owner:string}>();
  if(!user){const legacy=await env.DB.prepare('SELECT owner FROM auth_legacy_links WHERE email=?').bind(identity.email).first<{owner:string}>();const owner=legacy?.owner||crypto.randomUUID();await env.DB.prepare('INSERT OR IGNORE INTO auth_users(owner,google_sub,email,display_name,created_at) VALUES(?,?,?,?,?)').bind(owner,identity.subject,identity.email,identity.name,Date.now()).run();user=await env.DB.prepare('SELECT owner FROM auth_users WHERE google_sub=?').bind(identity.subject).first<{owner:string}>();if(!user)throw Error('Account link');}
  await env.DB.prepare('UPDATE auth_users SET email=?,display_name=? WHERE owner=?').bind(identity.email,identity.name,user.owner).run();
  const token=randomToken(),now=Date.now(),old=readCookie(req.headers.get('cookie'),sessionCookie);
  await env.DB.batch([env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at<? OR token_hash=?').bind(now,await digest(old)),env.DB.prepare('INSERT INTO auth_sessions(token_hash,owner,expires_at) VALUES(?,?,?)').bind(await digest(token),user.owner,now+14*86400000)]);
  h.append('Set-Cookie',cookie(sessionCookie,token,14*86400));h.set('Location',origin+safeReturn(flow.return_to));return new Response(null,{status:302,headers:h});
 }catch{console.warn(JSON.stringify({event:'google_login_failed'}));h.set('Location',origin+'/auth/error');return new Response(null,{status:302,headers:h})}
}
