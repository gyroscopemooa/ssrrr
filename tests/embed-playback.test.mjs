import test from 'node:test';
import assert from 'node:assert/strict';
import {embedPlaybackUrl} from '../lib/embed-playback.ts';
for(const provider of ['youtube','tiktok'])for(const autoplay of [false,true])test(`${provider}: sound enabled with autoplay=${autoplay}`,()=>{
 const url=new URL(embedPlaybackUrl(provider,'123456789',autoplay));
 assert.equal(url.searchParams.get(provider==='youtube'?'mute':'muted'),'0');
 assert.equal(url.searchParams.get('autoplay'),autoplay?'1':'0');
 assert.equal(url.searchParams.get('controls'),'1');
});
