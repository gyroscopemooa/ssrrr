import {getChatGPTUser} from '@/app/chatgpt-auth';
import {wrap,db,guard,json,cleanText,HttpError} from '@/lib/server';
import {ensureMember,isAdmin,reservedNickname} from '@/lib/settings';
export const GET=wrap(async()=>{const u=await getChatGPTUser();return Response.json({signedIn:!!u,isAdmin:isAdmin(u),member:u?await ensureMember(u.userId):null},{headers:{'Cache-Control':'no-store'}})});
export const POST=wrap(async req=>{const u=await guard(req);const d=await json(req);const nickname=cleanText(d.nickname,24);if(!isAdmin(u)&&reservedNickname(nickname))throw new HttpError(400,'운영진이나 사이트 공식 계정으로 오해할 수 있는 닉네임은 사용할 수 없습니다.');await ensureMember(u.userId);try{await db().prepare('UPDATE members SET nickname=? WHERE owner=?').bind(nickname,u.userId).run()}catch(e){if(String(e).includes('UNIQUE'))throw new HttpError(409,'이미 사용 중인 닉네임입니다.');throw e}return Response.json({member:await ensureMember(u.userId)})});

