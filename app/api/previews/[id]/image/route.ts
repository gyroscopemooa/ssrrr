import {wrap,db,bucket,HttpError} from '@/lib/server';
export const GET=wrap(async req=>{const id=new URL(req.url).pathname.split('/').at(-2)!;const p=await db().prepare('SELECT image_id FROM previews WHERE id=?').bind(id).first<{image_id:string}>();if(!p?.image_id)throw new HttpError(404,'이미지가 없습니다.');const o=await bucket().get(p.image_id);if(!o)throw new HttpError(404,'이미지가 없습니다.');const h=new Headers({'Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'});o.writeHttpMetadata(h);return new Response(o.body,{headers:h})});

