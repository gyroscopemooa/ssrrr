import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const run=promisify(execFile);
export async function speechEngineReady(){
 if(!process.env.SUBTITLE_PYTHON)return false;
 try{await run(process.env.SUBTITLE_PYTHON,['-c',"import sys; from faster_whisper import WhisperModel; WhisperModel(sys.argv[1],device='cpu',compute_type='int8',download_root='.worker-tmp/whisper-models',local_files_only=True)",process.env.SUBTITLE_MODEL||'small'],{timeout:180000,windowsHide:true,maxBuffer:100000});return true}catch{return false}
}
export function transcriptCues(data){
 if(!Array.isArray(data?.segments))throw Error('SUBTITLE_INVALID: 음성 인식 결과 형식 오류');
 const cues=[];
 for(const segment of data.segments){
  const words=Array.isArray(segment.words)&&segment.words.length?segment.words:[{start:segment.start,end:segment.end,text:segment.text}];
  let cue=null;
  for(const word of words){
   const text=String(word.text||'').trim();if(!text||!Number.isFinite(word.start)||!Number.isFinite(word.end)||word.end<=word.start)continue;
   if(cue&&(cue.original.length+text.length>38||word.end-cue.start>3.5)){cues.push(cue);cue=null}
   if(!cue)cue={start:word.start,end:word.end,original:text,ko:'',en:''};else{cue.original+=' '+text;cue.end=word.end}
  }
  if(cue)cues.push(cue);
 }
 for(const cue of cues){
  const translations=(data.english||[]).filter(s=>s.start<cue.end&&s.end>cue.start);
  cue.en=translations.map(s=>String(s.text||'').trim()).join(' ');
  if(data.language==='en'&&!cue.en)cue.en=cue.original;
  if(data.language==='ko')cue.ko=cue.original;
  if(cue.original.length>100||cue.ko.length>100||cue.en.length>250)throw Error('SUBTITLE_REVIEW_REQUIRED: 자막 구간이 너무 깁니다. 분할 검수 후 제작하세요.');
 }
 return cues;
}
export async function translateCuesToKorean(cues,language,{fetcher=fetch,url=process.env.SUBTITLE_TRANSLATION_API_URL,key=process.env.SUBTITLE_TRANSLATION_API_KEY,model=process.env.SUBTITLE_TRANSLATION_MODEL||'gpt-4.1-mini'}={}){
 if(language==='ko')return cues;
 if(!url||!key)throw Error('SUBTITLE_TRANSLATION_UNAVAILABLE: 한글 번역 API가 설정되지 않았습니다. 원문 자막을 선택하거나 번역 서버를 설정해 주세요.');
 const input=cues.map((cue,id)=>({id,text:cue.original}));
 const response=await fetcher(url,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,temperature:0,messages:[{role:'system',content:'Translate every subtitle into natural Korean. Preserve names, tone, and meaning. Return only a JSON array of objects with id and text; never omit an id.'},{role:'user',content:JSON.stringify({sourceLanguage:language,subtitles:input})}]})});
 if(!response.ok)throw Error('SUBTITLE_TRANSLATION_FAILED: 한글 번역 서버 응답 오류 '+response.status);
 const payload=await response.json();
 let content=payload?.choices?.[0]?.message?.content||'';content=content.replace(/^```(?:json)?\s*|\s*```$/g,'');
 let translated;try{translated=JSON.parse(content)}catch{throw Error('SUBTITLE_TRANSLATION_FAILED: 한글 번역 결과 형식 오류')}
 const byId=new Map(translated.map(item=>[Number(item.id),String(item.text||'').trim()]));
 for(let id=0;id<cues.length;id++){const ko=byId.get(id);if(!ko)throw Error('SUBTITLE_TRANSLATION_FAILED: 일부 한글 자막이 누락되었습니다.');cues[id].ko=ko}
 return cues;
}
export async function translateCuesLocally(cues,language,{execute=run,python=process.env.SUBTITLE_TRANSLATION_PYTHON||process.env.SUBTITLE_PYTHON,model=process.env.SUBTITLE_TRANSLATION_LOCAL_MODEL||'facebook/m2m100_418M',signal}={}){
 if(language==='ko')return cues;
 if(!python)throw Error('SUBTITLE_TRANSLATION_UNAVAILABLE: 로컬 번역 엔진이 설정되지 않았습니다.');
 const payload=Buffer.from(JSON.stringify({language,subtitles:cues.map((cue,id)=>({id,text:cue.original}))}),'utf8').toString('base64url');
 let stdout;try{({stdout}=await execute(python,[path.resolve('scripts/translate-local.py'),'--model',model,'--payload',payload],{signal,timeout:900000,maxBuffer:4000000,windowsHide:true,encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'}}))}catch(error){throw Error('SUBTITLE_TRANSLATION_FAILED: 로컬 번역에 실패했습니다. '+String(error?.stderr||error?.message||error).slice(0,180))}
 let translated;try{translated=JSON.parse(stdout)}catch{throw Error('SUBTITLE_TRANSLATION_FAILED: 로컬 번역 결과 형식 오류')}
 const byId=new Map(translated.map(item=>[Number(item.id),String(item.text||'').trim()]));
 for(let id=0;id<cues.length;id++){const ko=byId.get(id);if(!ko)throw Error('SUBTITLE_TRANSLATION_FAILED: 일부 한글 자막이 누락되었습니다.');cues[id].ko=ko}
 return cues;
}
export async function speechCaptions(file,mode,{execute=run,python=process.env.SUBTITLE_PYTHON,signal,translate}={}){
 if(!python)throw Error('SUBTITLE_SERVER_UNAVAILABLE: 작업 서버에 음성인식 엔진이 설정되지 않았습니다.');
 const args=[path.resolve('scripts/transcribe-local.py'),file,'--model',process.env.SUBTITLE_MODEL||'small'];
 const wantsKorean=mode==='ko'||mode==='original-ko'||mode==='original-ko-en',wantsEnglish=mode==='original-en'||mode==='original-ko-en';
 if(wantsEnglish)args.push('--english');
 const {stdout}=await execute(python,args,{signal,timeout:900000,maxBuffer:4000000,windowsHide:true,encoding:'utf8'});
 const data=JSON.parse(stdout),cues=transcriptCues(data);
 if(!cues.length)throw Error('SUBTITLE_NO_SPEECH: 인식 가능한 음성이 없습니다. 자막을 끄고 다시 제작할 수 있습니다.');
 if(wantsKorean&&data.language!=='ko')await (translate||translateCuesLocally)(cues,data.language||'en',{execute,signal});
 if(!wantsEnglish)for(const cue of cues)cue.en='';
 return cues;
}
