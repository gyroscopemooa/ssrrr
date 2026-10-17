type SourceBlock={type?:unknown;videoId?:unknown;url?:unknown;id?:unknown};
export type ExternalVideoRef={provider:'youtube'|'tiktok';sourceKey:string;sourceUrl:string};
export type ExternalVideoSource={source_key:string;source_url:string;provider:string;creator:string;rights_basis:string;media_id:string;status:string};

export function externalVideoCreator(value:string){try{const url=new URL(value),host=url.hostname.toLowerCase().replace(/^www\./,'');if(!['tiktok.com','m.tiktok.com'].includes(host))return '';const handle=decodeURIComponent(url.pathname).match(/^\/(\@[A-Za-z0-9._-]{1,80})(?:\/|$)/)?.[1];return handle||''}catch{return ''}}

function youtubeId(value:string){try{const url=new URL(value),host=url.hostname.toLowerCase().replace(/^www\./,'');let id='';if(host==='youtu.be')id=url.pathname.split('/')[1];else if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host))id=url.pathname==='/watch'?url.searchParams.get('v')||'':/^\/(shorts|embed|live)\//.test(url.pathname)?url.pathname.split('/')[2]:'';return /^[\w-]{11}$/.test(id)?id:null}catch{return null}}
function tiktokRef(value:string){try{const url=new URL(value),host=url.hostname.toLowerCase().replace(/^www\./,'');if(['tiktok.com','m.tiktok.com'].includes(host)){const id=url.pathname.match(/^\/(?:@[^/]+\/video|player\/v1|v)\/(\d{10,30})(?:\/|\.html)?$/)?.[1];return id?'tiktok:'+id:null}if(['vm.tiktok.com','vt.tiktok.com'].includes(host)&&/^\/[\w-]+\/?$/.test(url.pathname))return 'tiktok-short:'+host+url.pathname.replace(/\/$/,'');return null}catch{return null}}

export function externalVideoRef(block:SourceBlock):ExternalVideoRef|null{
 if(block.type==='youtube'&&typeof block.videoId==='string'&&/^[\w-]{11}$/.test(block.videoId))return {provider:'youtube',sourceKey:'youtube:'+block.videoId,sourceUrl:'https://www.youtube.com/shorts/'+block.videoId};
 if(block.type!=='link'||typeof block.url!=='string')return null;
 const youtube=youtubeId(block.url);if(youtube)return {provider:'youtube',sourceKey:'youtube:'+youtube,sourceUrl:block.url};
 const tiktok=tiktokRef(block.url);if(tiktok)return {provider:'tiktok',sourceKey:tiktok,sourceUrl:block.url};
 return null;
}

export function externalVideoRefs(blocks:SourceBlock[]){const refs=new Map<string,ExternalVideoRef>();for(const block of blocks){const ref=externalVideoRef(block);if(ref&&!refs.has(ref.sourceKey))refs.set(ref.sourceKey,ref)}return [...refs.values()]}

export function injectExternalVideos(blocks:SourceBlock[],sources:ExternalVideoSource[]){const byKey=new Map(sources.filter(source=>source.status==='ready').map(source=>[source.source_key,source]));return blocks.map(block=>{const ref=externalVideoRef(block);if(!ref)return block;const source=byKey.get(ref.sourceKey);if(!source)return block;return {type:'video',id:source.media_id,externalSource:true,sourceUrl:source.source_url,sourceProvider:source.provider,sourceCreator:source.creator,rightsBasis:source.rights_basis}})}
