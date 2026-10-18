import test from 'node:test';
import assert from 'node:assert/strict';
import {shortsWorkerReadiness} from '../lib/automation/worker-readiness.ts';
test('only recent capable workers count; subtitles must be on a renderer',()=>{
 const now=5000000;
 assert.deepEqual(shortsWorkerReadiness([{last_seen_at:1,capabilities:'{"render":true}'},{last_seen_at:now,capabilities:'bad'}],now),{render:false,acquire:false,subtitles:false});
 assert.deepEqual(shortsWorkerReadiness([{last_seen_at:now,capabilities:JSON.stringify({render:true})},{last_seen_at:now,capabilities:JSON.stringify({externalVideoDownload:true,speechSubtitles:true})}],now),{render:true,acquire:true,subtitles:false});
});
