import test from 'node:test';
import assert from 'node:assert/strict';
import {accentBursts,textTeaserExcerpt} from '../worker/caption-policy.mjs';

const plan=captionTone=>({settings:{captionTone,laughCaptions:'normal',laughIntervalSeconds:7},scenes:[{type:'post_title',from:90,frames:90,payload:{text:'짧은 제목뿐인 글'}}]});

test('issue shorts show an exclamation accent even when only a title is available',()=>{
 const bursts=accentBursts(plan('issue'));
 assert.ok(bursts.length>0);
 assert.ok(bursts.every(b=>b.text==='!!'));
});

test('serious shorts intentionally render without accent captions',()=>{
 assert.deepEqual(accentBursts(plan('serious')),[]);
});

test('text-only teaser picks a short punch line instead of the whole post',()=>{
 const body='송하다고 불방서도 풀타는 중\n\n아니 내가 사다 사다 뺀스 파우치까지 받아야 되냐고\n\n+ 사진과 관계없이\n\n브랜드 자체는 제품퀄 잘 뽑는 브랜드임..\n\n근데 대체 왜...?????';
 const excerpt=textTeaserExcerpt(body);
 assert.equal(excerpt,'브랜드 자체는 제품퀄 잘 뽑는 브랜드임..\n근데 대체 왜...?????');
 assert.ok(Array.from(excerpt).length<=46);
});
