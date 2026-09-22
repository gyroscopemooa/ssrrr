import {db,HttpError} from '../server';
import {sourceSchema} from './config';
import {sourceIdentity,validEvidence} from './validation.mjs';
import {taskStatement} from './server';

export async function saveSource(input:Record<string,unknown>){
 const source=sourceSchema.parse(input.source),id=source.id||crypto.randomUUID(),now=Date.now();
 const old=await db().prepare('SELECT tested_at,config FROM auto_sources WHERE id=?').bind(id).first<{tested_at:number|null;config:string}>();
 const previous=old?sourceSchema.parse(JSON.parse(old.config)):null;
 const changed=!previous||sourceIdentity(previous)!==sourceIdentity(source);
 const evidence=await db().prepare("SELECT counts FROM crawl_runs WHERE source_id=? AND status='completed' AND json_extract(counts,'$.validation') IS NOT NULL ORDER BY started_at DESC LIMIT 1").bind(id).first<{counts:string}>();
 const verified=!!old?.tested_at&&!changed&&validEvidence(source,evidence?JSON.parse(evidence.counts).validation:null);
 if(source.enabled&&!verified&&input.autoTest!==true)throw new HttpError(409,'수집 테스트를 먼저 통과해야 합니다.');
 const needsTest=input.testAfterSave===true||(input.autoTest===true&&(changed||source.enabled&&!verified));
 const token=needsTest&&source.enabled?crypto.randomUUID():null;
 const config=JSON.stringify({...source,id,enabled:source.enabled&&verified,...(token?{resumeAfterTest:token}:{})});
 const statements=[db().prepare("INSERT INTO auto_sources(id,name,config,enabled,tested_at,last_run_at,last_success_at,last_error,created_at,updated_at) VALUES(?,?,?,?,NULL,NULL,NULL,'미검증 소스',?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,config=excluded.config,enabled=excluded.enabled,tested_at=CASE WHEN ? THEN NULL ELSE auto_sources.tested_at END,last_error=CASE WHEN ? THEN '수집 조건 변경: 자동 검사 대기' ELSE auto_sources.last_error END,updated_at=excluded.updated_at").bind(id,source.name,config,source.enabled&&verified?1:0,now,now,changed?1:0,changed?1:0)];
 if(changed||needsTest){
  // Replacing a pending inspection must not allow its old response to enable the new config.
  statements.push(db().prepare("UPDATE worker_tasks SET status='cancelled',lease_token=NULL,lease_until=NULL,updated_at=? WHERE kind='scan' AND ref_id=? AND status IN ('queued','running')").bind(now,id));
 }
 if(needsTest)statements.push(taskStatement('scan',id,{test:true,...(token?{resumeAfterTest:token}:{})}));
 await db().batch(statements);
 return {id,testQueued:needsTest,resumeAfterTest:!!token};
}
