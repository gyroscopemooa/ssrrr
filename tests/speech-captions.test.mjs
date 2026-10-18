import test from 'node:test';
import assert from 'node:assert/strict';
import {transcriptCues,speechCaptions,translateCuesToKorean} from '../worker/speech-captions.mjs';
test('speech cues are timed and retain original and translated text',()=>{
 const cues=transcriptCues({language:'ko',segments:[{start:0,end:1,text:'안녕하세요'}],english:[{start:0,end:1,text:'Hello'}]});
 assert.deepEqual(cues,[{start:0,end:1,original:'안녕하세요',ko:'안녕하세요',en:'Hello'}]);
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
test('foreign speech can retain original and add Korean plus English',async()=>{
 const stdout=JSON.stringify({language:'ja',segments:[{start:0,end:1,text:'こんにちは'}],english:[{start:0,end:1,text:'Hello'}]});
 const cues=await speechCaptions('unused','original-ko-en',{python:'python',execute:async(_python,args)=>{assert(args.includes('--english'));return {stdout}},translate:async items=>{items[0].ko='안녕하세요';return items}});
 assert.deepEqual(cues,[{start:0,end:1,original:'こんにちは',ko:'안녕하세요',en:'Hello'}]);
});
test('Korean translation API rejects missing configuration explicitly',async()=>{
 await assert.rejects(translateCuesToKorean([{original:'Hola'}],'es',{url:'',key:''}),/SUBTITLE_TRANSLATION_UNAVAILABLE/);
});
