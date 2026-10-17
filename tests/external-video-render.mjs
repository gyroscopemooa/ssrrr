import {execFileSync} from 'node:child_process';
import {mkdtemp,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {binaries,renderJob} from '../worker/render.mjs';
import {shortsSchema} from '../lib/automation/config.ts';

const root=await mkdtemp(path.join(tmpdir(),'ssrrr-external-video-'));
const ff=args=>execFileSync(binaries.ffmpeg,['-y','-loglevel','error',...args]);
const video=path.join(root,'licensed.mp4'),bgm=path.join(root,'bgm.wav');
ff(['-f','lavfi','-i','testsrc=size=360x640:rate=30:duration=2','-f','lavfi','-i','sine=frequency=520:duration=2','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',video]);
ff(['-f','lavfi','-i','sine=frequency=220:duration=8','-c:a','pcm_s16le',bgm]);
const sourceUrl='https://www.tiktok.com/@creator/video/1234567890123456789';
const payload={posts:[{id:'external-post',title:'사용 허가된 외부 영상',category:'SNS',blocks:[{type:'video',id:'licensed',externalSource:true,sourceUrl,sourceProvider:'tiktok',sourceCreator:'@creator',rightsBasis:'원작자 서면 허가'}],media:[{id:'licensed',type:'video/mp4'}],comments:[],feed:[]}],assets:[{id:'bgm',type:'bgm',storage_key:'bgm',mime_type:'audio/wav',license_note:'QA generated'}],settings:shortsSchema.parse({bgmId:'bgm',audioPolicy:'duck',includeComments:false,maxPosts:1,minDuration:5,targetDuration:10,maxDuration:20}),brand:{name:'스르륵',url:'https://ssrrr.net'}};
try{const result=await renderJob(payload,{directory:path.join(root,'job'),download:(key,file)=>copyFile(key==='licensed'?video:bgm,file)});const scene=result.plan.scenes.find(item=>item.type==='video_play');assert(result.qc.passed);assert(result.qc.hasAudio);assert(result.qc.avDrift<=.25);assert.equal(scene.payload.sourceUrl,sourceUrl);assert.equal(scene.payload.sourceCreator,'@creator');console.log(JSON.stringify({status:'PASS',kind:'authorized_external_video',hasAudio:result.qc.hasAudio,avDrift:result.qc.avDrift,duration:result.qc.duration,sourceUrl:scene.payload.sourceUrl}))}finally{await rm(root,{recursive:true,force:true})}
