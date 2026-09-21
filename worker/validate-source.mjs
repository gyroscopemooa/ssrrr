import {GenericHtmlAdapter,DcinsideAdapter} from './adapters.mjs';
import {fetchPage} from './network.mjs';
import {sourceIdentity} from '../lib/automation/validation.mjs';
/** Read one complete list page, then public details; never retry an access denial. */
export async function validateSource(source,{onProgress=async()=>{},fetcher:fetchImpl=fetchPage}={}){
 const needsComments=source.commentLimit>0,needsMedia=source.images||source.videos;
 const requests=[];const fetcher=async(url,options)=>{try{const r=await fetchImpl(url,options);requests.push({url,method:options?.method||'GET',status:200,type:r.type,bytes:r.bytes.length});return r}catch(e){requests.push({url,method:options?.method||'GET',error:e.message});throw e}};const adapter=source.adapter==='dcinside'?new DcinsideAdapter(fetcher):new GenericHtmlAdapter(fetcher);
 const validation={version:2,identity:sourceIdentity(source),listPage:1,fullPage:false,listCount:0,details:0,comments:0,media:0,passed:false,checkedAt:new Date().toISOString(),samples:[],requests,errors:[]};
 const items=[];try{
 const list=await adapter.scanList({...source,scanLimit:Number.MAX_SAFE_INTEGER});Object.assign(validation,{fullPage:true,listCount:list.length});
 const candidates=[...list].sort((a,b)=>(b.metrics.comments>0)-(a.metrics.comments>0));
 for(const item of candidates.slice(0,5)){
  try{const detail=await adapter.loadDetail(item,source);if(!detail.blocks.length)throw Error('SELECTOR_MISMATCH: empty body');items.push(detail);validation.details++;validation.comments+=detail.comments.length;const sample={url:item.url,blocks:detail.blocks.length,comments:detail.comments.length,media:[]};validation.samples.push(sample);
   for(const media of detail.blocks.filter(b=>(b.type==='image'&&source.images)||(b.type==='video'&&source.videos)).slice(0,2)){
    const r=await fetcher(media.url,{hosts:[new URL(source.url).hostname,...source.mediaHosts],max:media.type==='video'?100*1024*1024:30*1024*1024,referer:item.url});
    if(!/^(image|video)\//i.test(r.type)||/^\s*</.test(r.bytes.subarray(0,30).toString()))throw Error('MEDIA_INVALID_CONTENT_TYPE: '+r.type);
    sample.media.push({url:media.url,type:r.type,bytes:r.bytes.length});validation.media++;
   }
   if((!needsComments||validation.comments>0)&&(!needsMedia||validation.media>0))break;
  }catch(e){validation.errors.push(String(e.message));if(/BLOCKED|HTTP (401|403|406|429|430)/.test(e.message))throw e;}
  await onProgress();
 }
 validation.passed=validation.details>0&&(!needsComments||validation.comments>0)&&(!needsMedia||validation.media>0)&&!validation.errors.length;
 if(!validation.passed&&!validation.errors.length)validation.errors.push('PARSING_UNVERIFIED: '+[!validation.details&&'detail',needsComments&&!validation.comments&&'comments',needsMedia&&!validation.media&&'media'].filter(Boolean).join(', '));
 }catch(e){if(!validation.errors.includes(e.message))validation.errors.push(e.message)}
 return {items:items.slice(0,source.scanLimit),validation,errors:validation.errors};
}
