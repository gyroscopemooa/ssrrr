import {wrap,guard,json,db,quota,HttpError} from '@/lib/server';import {preview} from '@/lib/previews';import {safeLink} from '@/lib/models';
export const GET=wrap(async req=>{const url=safeLink(new URL(req.url).searchParams.get('url')||'');if(!url)throw new HttpError(400,'주소를 확인해 주세요.');return Response.json({preview:await db().prepare('SELECT * FROM previews WHERE url=?').bind(url).first()},{headers:{'Cache-Control':'public, max-age=300'}})});
export const POST=wrap(async req=>{const u=await guard(req);const d=await json(req);await quota(u.userId,'previews',50);if(typeof d.url!=='string')throw new HttpError(400,'주소를 입력해 주세요.');return Response.json({preview:await preview(d.url)})});

