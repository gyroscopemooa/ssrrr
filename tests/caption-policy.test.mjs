import test from 'node:test';
import assert from 'node:assert/strict';
import {accentBursts} from '../worker/caption-policy.mjs';

const plan=captionTone=>({settings:{captionTone,laughCaptions:'normal',laughIntervalSeconds:7},scenes:[{type:'post_title',from:90,frames:90,payload:{text:'짧은 제목뿐인 글'}}]});

test('issue shorts show an exclamation accent even when only a title is available',()=>{
 const bursts=accentBursts(plan('issue'));
 assert.ok(bursts.length>0);
 assert.ok(bursts.every(b=>b.text==='!!'));
});

test('serious shorts intentionally render without accent captions',()=>{
 assert.deepEqual(accentBursts(plan('serious')),[]);
});
