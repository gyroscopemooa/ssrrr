import {getChatGPTUser} from '@/app/chatgpt-auth';import {wrap,db,HttpError} from '@/lib/server';import {member,settings} from '@/lib/settings';
export const GET=wrap(async()=>{const u=await getChatGPTUser();if(!u)throw new HttpError(401,'로그인 후 확인해 주세요.');const m=await member(u.userId);const [ledger,s]=await Promise.all([db().prepare('SELECT id,delta,reason,created_at FROM ledger WHERE owner=? ORDER BY created_at DESC LIMIT 50').bind(u.userId).all(),settings()]);return Response.json({member:m,ledger:ledger.results,settings:s.settings},{headers:{'Cache-Control':'no-store'}})});

