import test from 'node:test';
import assert from 'node:assert/strict';
import {playTikTokWithSound,isTikTokPlayerMessage,TIKTOK_PLAYER_ORIGIN} from '../lib/tiktok-player.ts';
test('sound button sends unMute then play to exact TikTok origin',()=>{
 const calls=[];playTikTokWithSound({postMessage:(...args)=>calls.push(args)});
 assert.deepEqual(calls,['unMute','play'].map(type=>[{'x-tiktok-player':true,type},TIKTOK_PLAYER_ORIGIN]));
 assert.doesNotThrow(()=>playTikTokWithSound(null));
});
test('only accepts messages from this player at TikTok origin',()=>{
 const target={},event={source:target,origin:TIKTOK_PLAYER_ORIGIN,data:{'x-tiktok-player':true}};
 assert.equal(isTikTokPlayerMessage(event,target),true);
 assert.equal(isTikTokPlayerMessage({...event,source:{}},target),false);
 assert.equal(isTikTokPlayerMessage({...event,origin:'https://evil.example'},target),false);
 assert.equal(isTikTokPlayerMessage({...event,data:{}},target),false);
});
