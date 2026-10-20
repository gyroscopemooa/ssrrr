import test from 'node:test';
import assert from 'node:assert/strict';
import {FPS,INTRO_INSERT_SECONDS,INTRO_SECONDS,buildPlan,textPages} from '../worker/planner.mjs';
import {mayAutoCombine} from '../lib/automation/shorts-policy.ts';
import {readFileSync} from 'node:fs';
test('text pages preserve Korean text and explicit line breaks within card bounds',()=>{
 const text=('뷁 쀍 ㅋㅋㅋ 제목과 자막\n').repeat(40);
 const pages=textPages(text);
 assert(pages.length>1);
 for(const page of pages){assert(page.split('\n').length<=11);assert(page.split('\n').every(line=>Array.from(line).length<=19))}
 assert.equal(pages.join('').replace(/\n/g,''),text.replace(/\n/g,''));
});
test('opening selects the post cover and keeps real comment reactions and domain',()=>{
 const plan=buildPlan([{title:'테스트 제목',blocks:[{type:'image',id:'i'}],media:[{id:'i',type:'image/png',src:'image.png'}],comments:[{body:'ㅋㅋㅋㅋ 진짜 웃겨요'}]}],{maxPosts:1,intro:true,outro:true,cta:true,includeComments:true,maxComments:3,speed:1,targetDuration:10,minDuration:5,maxDuration:60});
 assert.equal(plan.scenes[0].type,'image_hold');
 assert.equal(plan.scenes[0].frames,INTRO_INSERT_SECONDS*FPS);
 assert.equal(plan.scenes[0].payload.teaser,true);
 const intro=plan.scenes[1];
 assert.equal(intro.type,'intro');
 assert.equal(intro.from,INTRO_INSERT_SECONDS*FPS);
 assert.equal(intro.frames,Math.round(INTRO_SECONDS*FPS));
 assert.equal(intro.payload.text,'하루 1유머!\n스르륵!');
 assert.equal(plan.scenes[2].type,'feed_open');
 assert.equal(plan.scenes[2].from,(INTRO_INSERT_SECONDS+INTRO_SECONDS)*FPS);
 assert.equal(plan.scenes[2].payload.totalFrames,Math.round(1.8*FPS));
 assert.equal(plan.scenes[3].type,'image_hold');
 assert.equal(plan.scenes[3].payload.src,'image.png');
 assert.equal(plan.scenes.some(scene=>scene.type==='post_title'),false);
 assert.equal(plan.scenes.at(-1).payload.text,'더 많은 유머는!\n스르륵에서 같이 봐요');
 assert.equal(plan.scenes.find(s=>s.type==='comments').payload.reaction,'ㅋㅋㅋㅋ');
 assert.equal(plan.brand.url,'https://www.ssrrr.net');
});
test('a single image short stays concise even when the configured target is 40 seconds',()=>{
 const plan=buildPlan([{title:'',blocks:[{type:'image',id:'i'}],media:[{id:'i',type:'image/png',src:'image.png'}],comments:[]}],{maxPosts:2,intro:true,outro:true,cta:true,includeComments:true,maxComments:3,speed:1,targetDuration:40,minDuration:25,maxDuration:60});
 assert.equal(plan.fullDurationFrames/FPS,13.033333333333333);
 assert.deepEqual(plan.scenes.map(scene=>scene.type),['image_hold','intro','feed_open','image_hold','outro']);
 assert.equal(plan.scenes[2].payload.text,'오늘의 스르륵');
 assert.equal(plan.scenes.find(scene=>scene.type==='image_hold').payload.title,'오늘의 스르륵');
 assert.equal(plan.warnings.length,0);
});
test('impact intro follows a 2.5 second teaser before the full story restarts',()=>{
 const plan=buildPlan([{title:'임팩트 테스트',blocks:[],media:[],comments:[]}],{maxPosts:1,intro:true,introStyle:'impact',outro:true,cta:true,includeComments:false,maxComments:0,speed:1,targetDuration:10,minDuration:5,maxDuration:60});
 assert.equal(plan.scenes[0].type,'feed_open');
 assert.equal(plan.scenes[0].payload.teaser,true);
 assert.equal(plan.scenes[1].type,'intro_impact');
 assert.equal(plan.scenes[1].from,Math.round(2.5*FPS));
 assert.equal(plan.scenes[1].frames,Math.ceil(1.712*FPS));
 assert.equal(plan.scenes[2].type,'feed_open');
});
test('motion intro follows a 2.5 second teaser before the full story restarts',()=>{
 const plan=buildPlan([{title:'모션 테스트',blocks:[],media:[],comments:[]}],{maxPosts:1,intro:true,introStyle:'motion',outro:true,cta:true,includeComments:false,maxComments:0,speed:1,targetDuration:10,minDuration:5,maxDuration:60});
 assert.equal(plan.scenes[0].type,'feed_open');
 assert.equal(plan.scenes[0].payload.teaser,true);
 assert.equal(plan.scenes[1].type,'intro_motion');
 assert.equal(plan.scenes[1].from,Math.round(2.5*FPS));
 assert.equal(plan.scenes[1].frames,Math.ceil(1.712*FPS));
 assert.equal(plan.scenes[2].type,'feed_open');
});
test('opening teaser preserves the complete still image and GIF instead of cropping them',()=>{
 const source=readFileSync(new URL('../worker/remotion/site-flow.jsx',import.meta.url),'utf8');
 const teaser=source.slice(source.indexOf('function TeaserScene'),source.indexOf('function Scene(',source.indexOf('function TeaserScene')));
 assert.match(teaser,/objectFit:'contain'/);
 assert.match(teaser,/fit="contain"/);
 assert.doesNotMatch(teaser,/objectPosition:'center 35%'/);
});
test('external vertical videos use the tall preserve-aspect layout without changing regular media scenes',()=>{
 const source=readFileSync(new URL('../worker/remotion/site-flow.jsx',import.meta.url),'utf8');
 const external=source.slice(source.indexOf('function ExternalVideoScene'),source.indexOf('function MediaScene'));
 assert.match(external,/top:232/);
 assert.match(external,/bottom:98/);
 assert.match(external,/objectFit:'contain'/);
 assert.match(external,/objectPosition:'center bottom'/);
 assert.match(external,/position:'absolute'.*inset:8.*SpeechSubtitle.*speechSubtitlePosition/s);
 assert.match(source,/SUBTITLE_POSITION=\{top:.*middle:.*bottom:/s);
 assert.doesNotMatch(source,/SourceCredit[\s\S]*payload\.sourceUrl\}<\/div>/);
 assert.match(source,/scene\.type==='video_play'&&scene\.payload\.sourceUrl/);
});
test('auto combine is limited to text-only non-economy posts',()=>{
 assert.equal(mayAutoCombine([{type:'text',text:'짧은 유머'}],'유머'),true);
 assert.equal(mayAutoCombine([{type:'image',id:'i'}],'유머'),false);
 assert.equal(mayAutoCombine([{type:'text',text:'짧은 글'}],'경제'),false);
});

test('tall images scroll at readable width and outro never pads the target duration',()=>{
 const settings={maxPosts:1,intro:true,outro:true,cta:true,includeComments:false,speed:1,targetDuration:40,minDuration:25,maxDuration:60};
 const plan=buildPlan([{title:'긴 이미지',blocks:[{type:'image',id:'long'}],media:[{id:'long',type:'image/jpeg',src:'long.jpg',width:600,height:16000}],comments:[]}],settings);
 const scroll=plan.scenes.find(s=>s.type==='image_scroll'&&!s.payload.teaser);assert(scroll);assert.equal(scroll.payload.imageHeight,16000);assert(scroll.frames>=240);assert.equal(plan.scenes.at(-1).frames,90);
 assert.equal(plan.scenes.reduce((sum,s)=>sum+s.frames,0),plan.durationFrames);
});
