// Explicit, local-only test for the existing post the user authorized.
// No publishing, cookies, proxies, CAPTCHA handling or stream-format fallback.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {binaries,probe,renderJob} from '../worker/render.mjs';
import {shortsSchema} from '../lib/automation/config.ts';
import {downloadExternal} from '../worker/tiktok-download.mjs';
const run=promisify(execFile);
const postId='b649d9bf-13c6-4bf3-a09f-8cbd012eecb6';
const root=path.resolve('outputs',`existing-tiktok-${Date.now()}`);
await mkdir(root,{recursive:true});
const ff=args=>run(binaries.ffmpeg,['-y','-hide_banner','-loglevel','error',...args],{windowsHide:true,maxBuffer:4000000});
try {
 const response=await fetch(`https://ssrrr.net/api/posts/${postId}`);
 assert(response.ok,'Existing post API failed');
 const data=await response.json(),post=data.post||data;
 const blocks=typeof post.body==='string'?JSON.parse(post.body):post.body;
 const link=blocks.find(b=>b.type==='link'&&b.url?.includes('tiktok.com/'));
 assert(link,'Existing post must contain a TikTok link');
 const url=new URL(link.url);url.search='';
 assert.equal(url.hostname,'www.tiktok.com');
 assert.equal(url.pathname,'/@dheepeeq1i0/video/7684125429925563656');
 const creator='@'+url.pathname.split('/')[1].slice(1);
 const subtitles=process.env.EXISTING_TIKTOK_SUBTITLES?JSON.parse(await readFile(process.env.EXISTING_TIKTOK_SUBTITLES,'utf8')):[];
 const source=path.join(root,'source.mp4');
 if(process.env.EXISTING_TIKTOK_SOURCE)await copyFile(process.env.EXISTING_TIKTOK_SOURCE,source);
 else await downloadExternal(url.href,source);
 const original=await probe(source);assert(original.hasAudio);assert(original.duration>0);

 const payload={posts:[{...post,blocks:[{type:'video',id:'authorized-source',externalSource:true,sourceUrl:url.href,sourceProvider:'tiktok',sourceCreator:creator,subtitles,rightsBasis:'User states creator permitted editing and republication; platform operation not certified'}],media:[{id:'authorized-source',type:'video/mp4'}],comments:[],feed:[]}],assets:[],settings:shortsSchema.parse({speechSubtitles:process.env.EXISTING_TIKTOK_SUBTITLE_MODE||'off',bgmEnabled:false,audioPolicy:'off',originalVolume:1,includeComments:false,maxPosts:1,minDuration:5,targetDuration:40,maxDuration:60,effects:'off'}),brand:{name:'스르륵',url:'https://ssrrr.net'}};
 const result=await renderJob(payload,{directory:path.join(root,'render'),download:(key,file)=>copyFile(source,file),stage:async name=>console.log(name)});
 const scene=result.plan.scenes.find(s=>s.type==='video_play'&&!s.payload.teaser);
 assert(scene?.payload.hasAudio);assert.equal(scene.payload.sourceCreator,creator);assert(result.qc.passed);
 // BGM is muted during original video (audioPolicy=off); compare its actual PCM
 // to source PCM, so a music-only output cannot pass this check.
 const start=Number(scene.payload.startFrame||0)/30,seconds=Math.min(5,scene.frames/30-.2);
 const pcm=async(file,seek)=>(await run(binaries.ffmpeg,['-v','error','-i',file,'-ss',String(seek),'-t',String(seconds),'-vn','-ac','1','-ar','8000','-f','f32le','pipe:1'],{encoding:'buffer',maxBuffer:4000000,windowsHide:true})).stdout;
 const a=await pcm(source,start),b=await pcm(result.file,scene.from/30);
 let best=0;
 for(let lag=-800;lag<=800;lag++){let xy=0,xx=0,yy=0;const n=Math.min(a.length,b.length)/4;for(let i=800;i<n-800;i++){const x=a.readFloatLE(i*4),y=b.readFloatLE((i+lag)*4);xy+=x*y;xx+=x*x;yy+=y*y}best=Math.max(best,xy/Math.sqrt(xx*yy)||0)}
 assert(best>.8,`Original audio correlation too low: ${best}`);
 await ff(['-ss',String(scene.from/30+1),'-i',result.file,'-frames:v','1',path.join(root,'actual-frame.png')]);
 const evidence={status:'PASS_LOCAL_ONLY',postId,sourceUrl:url.href,creator,original:{duration:original.duration,hasAudio:original.hasAudio},output:result.file,qc:result.qc,originalAudioCorrelation:best,productionBgm:false,testTone:false,subtitleCount:scene.payload.subtitles?.length||0,platformAutomationApproved:false,pcIndependent:false,uploaded:false};
 await writeFile(path.join(root,'evidence.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify(evidence));
}catch(error){await writeFile(path.join(root,'failure.json'),JSON.stringify({status:'FAILED',error:String(error.message)},null,2));throw error}
