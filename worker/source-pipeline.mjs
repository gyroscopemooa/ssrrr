import {GenericHtmlAdapter,DcinsideAdapter} from './adapters.mjs';
import {fetchPage} from './network.mjs';
import {mediaType} from './media-type.mjs';
import {sourceIdentity} from '../lib/automation/validation.mjs';
import {requiredFields,chooseMode,stagesFor,fieldsFor,missingFields} from '../lib/automation/modes.mjs';
const blocked=e=>/BLOCKED|HTTP (401|403|406|429|430)/.test(String(e));
export async function collectSource(source,{test=false,fetcher:fetchImpl=fetchPage,onProgress=async()=>{}}={}){
 const required=requiredFields(source),requests=[],warnings=[],issues=[],items=[],deniedUrls=new Map(),rateLimitedHosts=new Set();
 const fetcher=async(url,options)=>{try{const r=await fetchImpl(url,options);requests.push({url,method:options?.method||'GET',status:200,type:r.type,bytes:r.bytes.length});return r}catch(e){requests.push({url,method:options?.method||'GET',error:e.message});throw e}};
 const v={version:3,identity:sourceIdentity(source),mode:source.collectionMode||'AUTO',listPage:1,fullPage:false,listCount:0,details:0,comments:0,media:0,eligibleCount:0,passed:false,requiredFields:required,availableFields:[],missingFields:required,stages:{list:{status:'pending'},detail:{status:'unused'},comments:{status:'unused'},media:{status:'unused'}},checkedAt:new Date().toISOString(),samples:[],requests,errors:[],warnings,alternatives:[]};
 const adapter=source.adapter==='dcinside'?new DcinsideAdapter(fetcher):new GenericHtmlAdapter(fetcher);
 try{
 const list=await adapter.scanList({...source,scanLimit:Number.MAX_SAFE_INTEGER});v.fullPage=true;v.listCount=list.length;v.stages.list={status:'passed',count:list.length};
 // Metadata alternatives are measured from this same response; they never satisfy missing required body/image fields.
 const metadata=list.filter(x=>['title','sourceUrl','sourcePostId'].every(f=>fieldsFor(x).includes(f)));
 if(metadata.length)v.alternatives.push({mode:'LINK_AGGREGATION',available:true,listCount:metadata.length,availableFields:['title','sourceUrl','sourcePostId'],note:'제목·원문 링크만 사용하는 별도 설정. 본문·이미지 확보 성공을 뜻하지 않습니다.'});
 v.mode=chooseMode(source,list);
 const stages=stagesFor(source,v.mode);v.detailRequired=stages.detail;v.commentsRequired=stages.comments;v.mediaRequired=stages.media;
 for(const k of ['detail','comments','media'])v.stages[k]={status:stages[k]?'pending':'unused',needed:stages[k]};
 const conflicts=[];if(required.includes('comments')&&!stages.comments)conflicts.push('comments');if(required.some(f=>['image','thumbnail','video'].includes(f))&&!stages.media)conflicts.push('media');if(required.some(f=>['image','thumbnail'].includes(f))&&!source.images)conflicts.push('image');if(required.includes('video')&&!source.videos)conflicts.push('video');if(conflicts.length)throw Error('REQUIRED_FIELD_DISABLED: '+[...new Set(conflicts)].join(', '));
 const candidates=stages.detail?[...list].sort((a,b)=>(b.metrics.comments>0)-(a.metrics.comments>0)):list;
 const limit=stages.detail&&test?5:test&&!stages.media?list.length:test?Math.min(5,list.length):source.scanLimit;
 for(const entry of candidates.slice(0,limit)){
 let item={...entry,blocks:[...(entry.blocks||[])],comments:[]},sampleErrors=[];
 try{
 if(stages.detail){try{item=await adapter.loadDetail(entry,{...source,commentLimit:stages.comments?source.commentLimit:0,ignoreCommentErrors:true});v.details++;v.stages.detail={status:'passed',needed:true,count:v.details}}catch(e){v.stages.detail={status:'failed',needed:true,error:e.message};throw e}}
 if(item.commentError){sampleErrors.push(item.commentError);v.stages.comments={status:'failed',needed:true,error:item.commentError};if(!required.includes('comments'))warnings.push(item.commentError)}else if(stages.comments){v.comments+=item.comments.length;v.stages.comments={status:item.comments.length?'passed':'empty',needed:true,count:v.comments}}
 const auto=(source.collectionMode||'AUTO')==='AUTO';
 item.blocks=item.blocks.filter(b=>b.type==='text'||b.type==='link'||stages.media&&(b.type==='image'&&source.images&&(!auto||required.some(f=>['image','thumbnail'].includes(f)))||['video','youtube'].includes(b.type)&&source.videos&&(!auto||required.includes('video'))));
 if(!stages.comments)item.comments=[];
 // Link aggregation never loads a detail page. Short summaries are capped to prevent full-content replication.
 if(v.mode==='LINK_AGGREGATION')item.blocks=item.blocks.map(b=>b.type==='text'?{...b,text:b.text.slice(0,500)}:b);
 const verifiedBlocks=[];let mediaAttempts=0;
 for(const b of item.blocks){if(!['image','video','youtube'].includes(b.type)){verifiedBlocks.push(b);continue}
 // A test proves at least one required media sample; regular collection keeps all permitted media.
 const kind=b.type==='image'?'image':'video';
 if(test&&(mediaAttempts>=3||verifiedBlocks.some(x=>(kind==='image'?x.type==='image':['video','youtube'].includes(x.type))&&x.verified)))continue;
 mediaAttempts++;
 try{if(b.type==='youtube'){verifiedBlocks.push({...b,verified:true});v.media++;continue}
 const host=new URL(b.url).hostname;if(rateLimitedHosts.has(host))throw Error('BLOCKED: HTTP 429; media host rate limited');
 if(deniedUrls.has(b.url))throw Error(deniedUrls.get(b.url));
 const r=await fetcher(b.url,{hosts:[new URL(source.url).hostname,...source.mediaHosts],max:b.type==='video'?100*1024*1024:30*1024*1024,referer:item.url});const type=mediaType(r.bytes,r.type);
 if(type==='image/gif'&&!source.gifs)continue;if(b.type==='image'&&!type.startsWith('image/')||b.type==='video'&&!type.startsWith('video/'))throw Error('MEDIA_INVALID_CONTENT_TYPE: '+type);
 verifiedBlocks.push({...b,verified:true});v.media++;
 }catch(e){sampleErrors.push(e.message);warnings.push(e.message);if(blocked(e)&&b.url)deniedUrls.set(b.url,e.message);if(/HTTP 429/.test(e.message)&&b.url)rateLimitedHosts.add(new URL(b.url).hostname)}
 }
 item.blocks=verifiedBlocks;item.bodyPresent=stages.detail&&item.blocks.some(b=>b.type==='text'&&b.text.trim()||['image','video'].includes(b.type));
 if(stages.media)v.stages.media={status:verifiedBlocks.some(b=>b.verified)?'passed':'empty',needed:true,count:v.media,origin:stages.detail?'detail':'list'};
 const available=fieldsFor(item,{verified:true}),missing=required.filter(f=>!available.includes(f));const eligible=!missing.length;
 const sample={url:item.url,availableFields:available,missingFields:missing,eligible,errors:sampleErrors,blocks:item.blocks.length,comments:item.comments.length};v.samples.push(sample);
 if(eligible){v.eligibleCount++;v.availableFields=[...new Set([...v.availableFields,...available])];
 item.collectionMode=v.mode;item.policyIdentity=sourceIdentity(source);item.availableFields=available;item.requiredFields=required;item.blocks=item.blocks.map(b=>{const clean={...b};delete clean.verified;delete clean.thumbnail;return clean});
 if(['LIST_ONLY','LIST_WITH_MEDIA','LINK_AGGREGATION'].includes(v.mode))item.blocks.push({type:'link',url:item.url});
 if(!item.blocks.length)item.blocks=[{type:'link',url:item.url}];items.push(item);
 if(test&&stages.detail)break;if(test&&stages.media)break;
 }else issues.push('REQUIRED_FIELDS_MISSING: '+missing.join(', '));
 if(item.commentError&&required.includes('comments')&&blocked(item.commentError))break;
 }catch(e){issues.push(e.message);v.samples.push({url:item.url,availableFields:fieldsFor(entry,{verified:true}),missingFields:missingFields(source,entry),eligible:false,errors:[e.message]});if(blocked(e))break}
 await onProgress();
 }
 v.passed=v.eligibleCount>0;v.missingFields=v.passed?[]:required.filter(f=>!v.samples.some(s=>s.eligible&&s.availableFields.includes(f)));
 if(!v.passed){v.availableFields=[...new Set(v.samples.flatMap(s=>s.availableFields))];v.missingFields=required.filter(f=>!v.availableFields.includes(f));if(!v.missingFields.length)v.missingFields=required;v.errors=[...new Set([...issues,...warnings,...v.samples.flatMap(s=>s.errors||[])])];if(!v.errors.length)v.errors.push('REQUIRED_FIELDS_MISSING: '+v.missingFields.join(', '));}
 }catch(e){v.errors.push(e.message);if(!v.fullPage)v.stages.list={status:'failed',error:e.message}}
 if(!test&&!items.length)throw Error(v.errors.join('; ')||'REQUIRED_FIELDS_MISSING');
 return {items:items.slice(0,source.scanLimit),validation:v,errors:v.errors};
}
