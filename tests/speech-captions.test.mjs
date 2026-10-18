import test from 'node:test';
import assert from 'node:assert/strict';
import {transcriptCues,speechCaptions} from '../worker/speech-captions.mjs';
test('speech cues are timed and retain original and translated text',()=>{
 const cues=transcriptCues({segments:[{start:0,end:1,text:'안녕하세요'}],english:[{start:0,end:1,text:'Hello'}]});
 assert.deepEqual(cues,[{start:0,end:1,ko:'안녕하세요',en:'Hello'}]);
});
test('missing subtitle engine fails explicitly before execution',async()=>{
 await assert.rejects(speechCaptions('unused','original',{python:'',execute:()=>assert.fail()}),/SUBTITLE_SERVER_UNAVAILABLE/);
});
test('oversized translation stops for review instead of clipping silently',()=>{
 assert.throws(()=>transcriptCues({segments:[{start:0,end:1,text:'원문'}],english:[{start:0,end:1,text:'x'.repeat(251)}]}),/SUBTITLE_REVIEW_REQUIRED/);
});
test('no detected speech cannot silently claim subtitles were created',async()=>{
 await assert.rejects(speechCaptions('unused','original',{python:'python',execute:async()=>({stdout:'{"segments":[]}'})}),/SUBTITLE_NO_SPEECH/);
});
