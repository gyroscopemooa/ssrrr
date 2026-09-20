import {getChatGPTUser} from '@/app/chatgpt-auth';
import {wrap,db,guard,json,cleanText,HttpError} from '@/lib/server';
import {settings,member,isAdmin} from '@/lib/settings';
export const GET=wrap(async()=>{const u=await getChatGPTUser();return Response.json({signedIn:!!u,isAdmin:isAdmin(u),member:u?await member(u.userId):null},{headers:{'Cache-Control':'no-store'}})});
export const POST=wrap(async req=>{const u=await guard(req);const d=await json(req);const nickname=cleanText(d.nickname,24);const existing=await member(u.userId);if(existing)return Response.json({member:existing});const s=await settings();try{await db().prepare('INSERT INTO members(owner,nickname,points,created_at) VALUES(?,?,?,?) ON CONFLICT(owner) DO NOTHING').bind(u.userId,nickname,s.settings.signupPoints,Date.now()).run()}catch(e){if(String(e).includes('UNIQUE'))throw new HttpError(409,'이미 사용 중인 닉네임입니다.');throw e}return Response.json({member:await member(u.userId)})});

