import {requiredFields,COLLECTION_MODES,stagesFor} from './modes.mjs';
/** Configuration identity used to invalidate evidence after parser/network changes. */
export function sourceIdentity(source){return JSON.stringify({version:2,url:source.url,adapter:source.adapter,selectors:source.selectors,mediaHosts:source.mediaHosts,commentLimit:source.commentLimit,images:source.images,videos:source.videos,gifs:source.gifs,...((source.collectionMode&&source.collectionMode!=='AUTO')||source.requiredFields||source.optionalFields||source.listSelectors||source.customStages?{policy:{collectionMode:source.collectionMode||'AUTO',requiredFields:source.requiredFields,optionalFields:source.optionalFields,listSelectors:source.listSelectors,customStages:source.customStages}}:{})})}
export function validEvidence(source,e){if(!e||e.identity!==sourceIdentity(source)||e.listPage!==1||e.fullPage!==true||!(e.listCount>0)||e.passed!==true)return false;
 if(e.version===2)return (source.collectionMode||'AUTO')==='AUTO'&&!source.requiredFields&&e.details>0&&(source.commentLimit===0||e.comments>0)&&(!(source.images||source.videos)||e.media>0);
 if(e.version!==3||!COLLECTION_MODES.includes(e.mode)||e.mode==='AUTO'||!(e.eligibleCount>0)||!Array.isArray(e.samples))return false;
 if(source.collectionMode&&source.collectionMode!=='AUTO'&&source.collectionMode!==e.mode)return false;
 const stages=stagesFor(source,e.mode);if(stages.detail&&!(e.details>0))return false;
 return e.samples.some(s=>s.eligible===true&&requiredFields(source).every(f=>s.availableFields?.includes(f)));
}
