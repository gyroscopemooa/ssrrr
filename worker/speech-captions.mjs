import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const run=promisify(execFile);
export async function speechEngineReady(){
 if(!process.env.SUBTITLE_PYTHON)return false;
 try{await run(process.env.SUBTITLE_PYTHON,['-c',"import sys; from faster_whisper import WhisperModel; WhisperModel(sys.argv[1],device='cpu',compute_type='int8',download_root='.worker-tmp/whisper-models',local_files_only=True)",process.env.SUBTITLE_MODEL||'small'],{timeout:30000,windowsHide:true,maxBuffer:100000});return true}catch{return false}
}
export function transcriptCues(data){
 if(!Array.isArray(data?.segments))throw Error('SUBTITLE_INVALID: 음성 인식 결과 형식 오류');
 const cues=[];
 for(const segment of data.segments){
  const words=Array.isArray(segment.words)&&segment.words.length?segment.words:[{start:segment.start,end:segment.end,text:segment.text}];
  let cue=null;
  for(const word of words){
   const text=String(word.text||'').trim();if(!text||!Number.isFinite(word.start)||!Number.isFinite(word.end)||word.end<=word.start)continue;
   if(cue&&(cue.ko.length+text.length>38||word.end-cue.start>3.5)){cues.push(cue);cue=null}
   if(!cue)cue={start:word.start,end:word.end,ko:text,en:''};else{cue.ko+=' '+text;cue.end=word.end}
  }
  if(cue)cues.push(cue);
 }
 for(const cue of cues){
  const translations=(data.english||[]).filter(s=>s.start<cue.end&&s.end>cue.start);
  cue.en=translations.map(s=>String(s.text||'').trim()).join(' ');
  if(cue.ko.length>100||cue.en.length>250)throw Error('SUBTITLE_REVIEW_REQUIRED: 자막 구간이 너무 깁니다. 분할 검수 후 제작하세요.');
 }
 return cues;
}
export async function speechCaptions(file,mode,{execute=run,python=process.env.SUBTITLE_PYTHON,signal}={}){
 if(!python)throw Error('SUBTITLE_SERVER_UNAVAILABLE: 작업 서버에 음성인식 엔진이 설정되지 않았습니다.');
 const args=[path.resolve('scripts/transcribe-local.py'),file,'--model',process.env.SUBTITLE_MODEL||'small'];
 if(mode==='original-en')args.push('--english');
 const {stdout}=await execute(python,args,{signal,timeout:900000,maxBuffer:4000000,windowsHide:true,encoding:'utf8'});
 const data=JSON.parse(stdout),cues=transcriptCues(data);
 if(!cues.length)throw Error('SUBTITLE_NO_SPEECH: 인식 가능한 음성이 없습니다. 자막을 끄고 다시 제작할 수 있습니다.');
 return cues;
}
