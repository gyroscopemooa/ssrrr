import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
test('real claim SQL keeps subtitle jobs away from renderers without the engine',()=>{
 const source=readFileSync(new URL('../lib/automation/server.ts',import.meta.url),'utf8');
 const sql=source.match(/prepare\("(UPDATE worker_tasks SET status='running'[^"\n]+)"\)/)?.[1];
 assert(sql);
 const db=new DatabaseSync(':memory:');
 try{
 db.exec("CREATE TABLE shorts_jobs(id TEXT,config TEXT); CREATE TABLE worker_tasks(id TEXT,ref_id TEXT,kind TEXT,status TEXT,lease_token TEXT,lease_until INTEGER,attempts INTEGER,updated_at INTEGER,run_at INTEGER,created_at INTEGER,payload TEXT); INSERT INTO shorts_jobs VALUES('job','{\"speechSubtitles\":\"original\"}'); INSERT INTO worker_tasks VALUES('task','job','render','queued',NULL,NULL,0,0,0,0,'{}');");
 const claim=db.prepare(sql);
 assert.equal(claim.get('token',999,1,1,'["render"]',0,0),undefined);
 assert.equal(claim.get('token',999,1,1,'["render"]',1,0).id,'task');
 }finally{db.close()}
});
