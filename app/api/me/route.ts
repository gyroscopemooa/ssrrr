import {getChatGPTUser} from '@/app/chatgpt-auth';
import {wrap,db,guard,json,cleanText,HttpError} from '@/lib/server';
import {ensureMember,isAdmin} from '@/lib/settings';
export const GET=wrap(async()=>{const u=await getChatGPTUser();return Response.json({signedIn:!!u,isAdmin:isAdmin(u),member:u?await ensureMember(u.userId):null},{headers:{'Cache-Control':'no-store'}})});
export const POST=wrap(async req=>{const u=await guard(req);const d=await json(req);const nickname=cleanText(d.nickname,24);await ensureMember(u.userId);try{await db().prepare('UPDATE members SET nickname=? WHERE owner=?').bind(nickname,u.userId).run()}catch(e){if(String(e).includes('UNIQUE'))throw new HttpError(409,'이미 사용 중인 닉네임입니다.');throw e}return Response.json({member:await ensureMember(u.userId)})});

