import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlan} from '../worker/planner.mjs';
import {shortsSchema} from '../lib/automation/config.ts';
const settings=shortsSchema.parse({});
const post=media=>({id:'existing',title:'Existing post',blocks:[{type:'video',id:'source',externalSource:true}],media,comments:[]});
test('authorized external source cannot silently become title-only success',()=>{
 for(const media of [[],[{id:'source',src:null,type:'video/mp4'}],[{id:'source',src:'http://localhost/source.mp4',type:'video/mp4',duration:20,hasAudio:false}],[{id:'source',src:'http://localhost/source.mp4',type:'video/mp4',duration:0,hasAudio:true}]])assert.throws(()=>buildPlan([post(media)],settings),/EXTERNAL_MEDIA_INVALID/);
});
test('external source with actual video and sound reaches the video timeline',()=>{
 const plan=buildPlan([post([{id:'source',src:'http://localhost/source.mp4',type:'video/mp4',duration:20,hasAudio:true}])],settings);
 assert(plan.scenes.some(scene=>scene.type==='video_play'&&scene.payload.hasAudio));
});
