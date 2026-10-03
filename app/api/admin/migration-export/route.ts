import {env} from 'cloudflare:workers';
import {db,bucket,HttpError,wrap} from '@/lib/server';
const expires=Date.parse('2026-10-05T15:00:00Z');
const tables=['audit','auto_candidates','auto_post_jobs','auto_sources','comments','crawl_runs','email_ingest_messages','grants','job_events','ledger','likes','media','members','ops_settings','post_views','posts','previews','purchases','quotas','reports','settings','shorts_assets','shorts_job_posts','shorts_jobs','shorts_locks','shorts_metrics','shorts_outputs','shorts_publications','system_profiles','worker_health','worker_tasks'];
export const GET=wrap(async req=>{
 const key=env.MIGRATION_EXPORT_TOKEN;
 if(!key||Date.now()>expires)throw new HttpError(404,'Not found');
 const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [a,b]=await Promise.all([digest(req.headers.get('authorization')||''),digest('Bearer '+key)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];if(diff)throw new HttpError(401,'Unauthorized');
 const u=new URL(req.url),action=u.searchParams.get('action');const headers={'Cache-Control':'no-store'};
 if(action==='schema'){const schema=await db().prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL AND type IN ('table','index','trigger')").all();return Response.json({schema:schema.results.filter(r=>tables.includes(String(r.tbl_name))),tables},{headers})}
 if(action==='rows'){const table=u.searchParams.get('table')||'';if(!tables.includes(table))throw new HttpError(400,'Invalid table');const after=Number(u.searchParams.get('after')||0);if(!Number.isSafeInteger(after)||after<0)throw new HttpError(400,'Invalid cursor');const rows=await db().prepare('SELECT rowid AS __migration_rowid,* FROM "'+table+'" WHERE rowid>? ORDER BY rowid LIMIT 100').bind(after).all();return Response.json({rows:rows.results},{headers})}
 if(action==='objects'){const list=await bucket().list({limit:100,cursor:u.searchParams.get('cursor')||undefined,include:['httpMetadata','customMetadata']});return Response.json({objects:list.objects,truncated:list.truncated,cursor:list.truncated?list.cursor:null},{headers})}
 if(action==='object'){const key=u.searchParams.get('key');if(!key)throw new HttpError(400,'Key required');const obj=await bucket().get(key);if(!obj)throw new HttpError(404,'Not found');return new Response(obj.body,{headers:{...headers,'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream','Content-Length':String(obj.size)}})}
 throw new HttpError(400,'Invalid action');
});
