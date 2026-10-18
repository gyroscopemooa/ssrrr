import test from 'node:test';
import assert from 'node:assert/strict';
import {activeSubtitle} from '../worker/subtitles.mjs';
import {buildPlan} from '../worker/planner.mjs';
import {shortsSchema} from '../lib/automation/config.ts';
test('subtitle timing follows original media offset, including teasers and split scenes',()=>{
 const cues=[{start:1,end:2,ko:'첫 자막'},{start:2,end:3,ko:'다음 자막'}];
 assert.equal(activeSubtitle(cues,0),null);
 assert.equal(activeSubtitle(cues,30).ko,'첫 자막');
 assert.equal(activeSubtitle(cues,0,60).ko,'다음 자막');
 assert.equal(activeSubtitle(cues,90),null);
});
test('render plan preserves speech cues in the original video and teaser',()=>{
 const subtitles=[{start:0,end:20,ko:'한국어',en:'English'}];
 const plan=buildPlan([{id:'post',title:'자막 검사',blocks:[{type:'video',id:'video',subtitles}],media:[{id:'video',type:'video/mp4',src:'http://localhost/video.mp4',duration:20,hasAudio:true}],comments:[]}],shortsSchema.parse({bgmEnabled:false}));
 const scenes=plan.scenes.filter(s=>s.type==='video_play');
 assert(scenes.some(s=>s.payload.teaser));
 for(const scene of scenes)assert.deepEqual(scene.payload.subtitles,subtitles);
});
