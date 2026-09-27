import {z} from 'zod';
import {db,HttpError} from '@/lib/server';
import {sourceSchema} from './config';
import {sourceIdentity,validEvidence} from './validation.mjs';
export const bulkPatchSchema=sourceSchema.pick({collectionMode:true,requiredFields:true,optionalFields:true,commentLimit:true,images:true,videos:true,gifs:true,scanLimit:true,dailyLimit:true,intervalMinutes:true,minViews:true,minLikes:true,minComments:true,maxAgeDays:true,preferNew:true,fallback:true,board:true,prefix:true,selection:true,mediaFailure:true,denyWords:true,weights:true}).partial().strict();
export async function bulkSources(raw:Record<string,unknown>){
 const ids=[...new Set(z.array(z.string().min(1).max(80)).min(1).max(200).parse(raw.ids))];
 const mode=z.enum(['test','settings','on','off']).parse(raw.mode),patch=mode==='settings'?bulkPatchSchema.parse(raw.patch):{};
 if(mode==='settings'&&!Object.keys(patch).length)throw new HttpError(400,'변경할 항목을 선택하세요.');
 const results=[];
 for(const id of ids){
 const row=await db().prepare('SELECT config FROM auto_sources WHERE id=?').bind(id).first<{config:string}>();
 if(!row){results.push({id,status:'skipped',reason:'삭제되었거나 없는 사이트'});continue}
 if(mode==='test'){
 const now=Date.now();const r=await db().prepare("INSERT INTO worker_tasks(id,kind,ref_id,payload,status,attempts,max_attempts,run_at,lease_token,lease_until,error,created_at,updated_at) SELECT ?,'scan',?,'{\"test\":true}','queued',0,3,?,NULL,NULL,'',?,? WHERE EXISTS(SELECT 1 FROM auto_sources WHERE id=?) AND NOT EXISTS(SELECT 1 FROM worker_tasks WHERE kind='scan' AND ref_id=? AND status IN ('queued','running'))").bind(crypto.randomUUID(),id,now,now,now,id,id).run();
 results.push({id,status:r.meta.changes?'queued':'skipped',reason:r.meta.changes?'검사 대기열에 추가':'이미 수집 또는 검사 대기·진행 중'});continue;
 }
 if(mode==='on'){
 const run=await db().prepare("SELECT counts FROM crawl_runs WHERE source_id=? AND status='completed' AND json_extract(counts,'$.validation') IS NOT NULL ORDER BY started_at DESC LIMIT 1").bind(id).first<{counts:string}>();
 const before=sourceSchema.parse(JSON.parse(row.config));let passed=false;try{passed=validEvidence(before,run?JSON.parse(run.counts).validation:null)}catch{}
 if(!passed){results.push({id,status:'skipped',reason:'수집 테스트를 통과해야 켤 수 있음'});continue}
 const next={...before,enabled:true};const r=await db().prepare("UPDATE auto_sources SET config=?,enabled=1,last_error='',updated_at=? WHERE id=? AND config=? AND tested_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM worker_tasks WHERE kind='scan' AND ref_id=? AND status='running')").bind(JSON.stringify(next),Date.now(),id,row.config,id).run();
 results.push({id,status:r.meta.changes?'updated':'skipped',reason:r.meta.changes?'자동수집 ON':'검사 실행 중 또는 설정 변경됨'});continue;
 }
 const before=sourceSchema.parse(JSON.parse(row.config)),next=sourceSchema.parse({...before,...patch}),changed=sourceIdentity(before)!==sourceIdentity(next);
 if(changed||mode==='off')next.enabled=false;
 const r=await db().prepare("UPDATE auto_sources SET config=?,enabled=?,tested_at=CASE WHEN ? THEN NULL ELSE tested_at END,last_error=CASE WHEN ? THEN '수집 조건 변경: 다시 검사하세요.' ELSE last_error END,updated_at=? WHERE id=? AND config=? AND NOT EXISTS(SELECT 1 FROM worker_tasks WHERE status='running' AND ((kind='scan' AND ref_id=?) OR (kind='publish' AND ref_id IN (SELECT id FROM auto_post_jobs WHERE source_id=?))))").bind(JSON.stringify(next),next.enabled?1:0,changed?1:0,changed?1:0,Date.now(),id,row.config,id,id).run();
 results.push({id,status:r.meta.changes?'updated':'skipped',reason:r.meta.changes?(changed?'저장 완료 · OFF · 재검사 필요':'저장 완료'):'작업 실행 중 또는 설정 변경됨. 완료 후 다시 적용하세요.'});
 }
 return {results};
}
