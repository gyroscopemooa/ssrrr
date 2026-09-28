import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlan,textPages} from '../worker/planner.mjs';
test('text pages preserve Korean text and explicit line breaks within card bounds',()=>{
 const text=('뷁 쀍 ㅋㅋㅋ 제목과 자막\n').repeat(40);
 const pages=textPages(text);
 assert(pages.length>1);
 for(const page of pages){assert(page.split('\n').length<=11);assert(page.split('\n').every(line=>Array.from(line).length<=19))}
 assert.equal(pages.join('').replace(/\n/g,''),text.replace(/\n/g,''));
});
test('opening selects the post cover and keeps real comment reactions and domain',()=>{
 const plan=buildPlan([{title:'테스트 제목',blocks:[{type:'image',id:'i'}],media:[{id:'i',type:'image/png',src:'image.png'}],comments:[{body:'ㅋㅋㅋㅋ 진짜 웃겨요'}]}],{maxPosts:1,intro:true,outro:true,cta:true,includeComments:true,maxComments:3,speed:1,targetDuration:10,minDuration:5,maxDuration:60});
 assert.equal(plan.scenes[0].type,'feed_open');
 assert.equal(plan.scenes[1].type,'post_title');
 assert.equal(plan.scenes[1].payload.src,'image.png');
 assert.equal(plan.scenes.find(s=>s.type==='comments').payload.reaction,'ㅋㅋㅋㅋ');
 assert.equal(plan.brand.url,'https://www.ssrrr.net');
});
