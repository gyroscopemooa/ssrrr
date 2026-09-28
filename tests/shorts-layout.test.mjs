import test from 'node:test';
import assert from 'node:assert/strict';
import {FPS,buildPlan,textPages} from '../worker/planner.mjs';
import {mayAutoCombine} from '../lib/automation/shorts-policy.ts';
test('text pages preserve Korean text and explicit line breaks within card bounds',()=>{
 const text=('뷁 쀍 ㅋㅋㅋ 제목과 자막\n').repeat(40);
 const pages=textPages(text);
 assert(pages.length>1);
 for(const page of pages){assert(page.split('\n').length<=11);assert(page.split('\n').every(line=>Array.from(line).length<=19))}
 assert.equal(pages.join('').replace(/\n/g,''),text.replace(/\n/g,''));
});
test('opening selects the post cover and keeps real comment reactions and domain',()=>{
 const plan=buildPlan([{title:'테스트 제목',blocks:[{type:'image',id:'i'}],media:[{id:'i',type:'image/png',src:'image.png'}],comments:[{body:'ㅋㅋㅋㅋ 진짜 웃겨요'}]}],{maxPosts:1,intro:true,outro:true,cta:true,includeComments:true,maxComments:3,speed:1,targetDuration:10,minDuration:5,maxDuration:60});
 assert.equal(plan.scenes[0].type,'intro');
 assert.equal(plan.scenes[0].frames,Math.round(1.1*FPS));
 assert.equal(plan.scenes[0].payload.text,'하루 1유머!\n스르륵!');
 assert.equal(plan.scenes[1].type,'feed_open');
 assert.equal(plan.scenes[1].frames,3*FPS);
 assert.equal(plan.scenes[2].type,'post_title');
 assert.equal(plan.scenes[2].payload.src,'image.png');
 assert.equal(plan.scenes.at(-1).payload.text,'더 많은 유머는!\n스르륵에서 같이 봐요');
 assert.equal(plan.scenes.find(s=>s.type==='comments').payload.reaction,'ㅋㅋㅋㅋ');
 assert.equal(plan.brand.url,'https://www.ssrrr.net');
});
test('a single image short stays concise even when the configured target is 40 seconds',()=>{
 const plan=buildPlan([{title:'',blocks:[{type:'image',id:'i'}],media:[{id:'i',type:'image/png',src:'image.png'}],comments:[]}],{maxPosts:2,intro:true,outro:true,cta:true,includeComments:true,maxComments:3,speed:1,targetDuration:40,minDuration:25,maxDuration:60});
 assert.equal(plan.fullDurationFrames/FPS,13.1);
 assert.deepEqual(plan.scenes.map(scene=>scene.type),['intro','feed_open','post_title','image_hold','outro']);
 assert.equal(plan.scenes[1].payload.text,'오늘의 스르륵');
 assert.equal(plan.scenes[2].payload.text,'오늘의 스르륵');
 assert.equal(plan.scenes.find(scene=>scene.type==='image_hold').payload.title,'오늘의 스르륵');
 assert.equal(plan.warnings.length,0);
});
test('impact intro keeps the 1.1 second opening and uses the three-frame scene',()=>{
 const plan=buildPlan([{title:'임팩트 테스트',blocks:[],media:[],comments:[]}],{maxPosts:1,intro:true,introStyle:'impact',outro:true,cta:true,includeComments:false,maxComments:0,speed:1,targetDuration:10,minDuration:5,maxDuration:60});
 assert.equal(plan.scenes[0].type,'intro_impact');
 assert.equal(plan.scenes[0].frames,Math.round(1.1*FPS));
 assert.equal(plan.scenes[1].type,'feed_open');
});
test('motion intro keeps the 1.1 second opening and uses the animated scene',()=>{
 const plan=buildPlan([{title:'모션 테스트',blocks:[],media:[],comments:[]}],{maxPosts:1,intro:true,introStyle:'motion',outro:true,cta:true,includeComments:false,maxComments:0,speed:1,targetDuration:10,minDuration:5,maxDuration:60});
 assert.equal(plan.scenes[0].type,'intro_motion');
 assert.equal(plan.scenes[0].frames,Math.round(1.1*FPS));
 assert.equal(plan.scenes[1].type,'feed_open');
});
test('auto combine is limited to text-only non-economy posts',()=>{
 assert.equal(mayAutoCombine([{type:'text',text:'짧은 유머'}],'유머'),true);
 assert.equal(mayAutoCombine([{type:'image',id:'i'}],'유머'),false);
 assert.equal(mayAutoCombine([{type:'text',text:'짧은 글'}],'경제'),false);
});
