export type Block =
 | {type:'text';text:string}
 | {type:'image';id:string}
 | {type:'video';id:string}
 | {type:'youtube';videoId:string}
 | {type:'link';url:string};
export type Settings={autoplay:boolean;copyProtection:boolean;popularComments:number;popularLikes:number;popularViews:number;popularMode:'all'|'any';popularDays:number;popularLimit:number;imageCost:number;videoCost:number;textCost:number;signupPoints:number};
export const defaultSettings:Settings={autoplay:false,copyProtection:true,popularComments:5,popularLikes:10,popularViews:100,popularMode:'all',popularDays:7,popularLimit:20,imageCost:10,videoCost:30,textCost:5,signupPoints:0};
export function youtubeId(value:string):string|null {try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null;const h=u.hostname.toLowerCase().replace(/^www\./,'');let id='';if(h==='youtu.be')id=u.pathname.split('/')[1];else if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(h)){id=u.pathname==='/watch'?u.searchParams.get('v')||'':/^\/(shorts|embed|live)\//.test(u.pathname)?u.pathname.split('/')[2]:''}return /^[\w-]{11}$/.test(id)?id:null}catch{return null}}
export function safeLink(value:string):string|null {try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&value.length<=2000?u.href:null}catch{return null}}
export function splitLinks(text:string):Block[]{const result:Block[]=[];let end=0;for(const m of text.matchAll(/https?:\/\/[^\s<>"']+/g)){const url=m[0].replace(/[.,!?;:)\]}]+$/,'');const safe=safeLink(url);if(!safe)continue;if(m.index!>end)result.push({type:'text',text:text.slice(end,m.index)});const videoId=youtubeId(safe);result.push(videoId?{type:'youtube',videoId}:{type:'link',url:safe});end=m.index!+url.length}if(end<text.length)result.push({type:'text',text:text.slice(end)});return result.length?result:[{type:'text',text}]}
export function popularPredicate(s:Settings){const checks:[string,number][]=[['comments',s.popularComments],['likes',s.popularLikes],['views',s.popularViews]];const active=checks.filter(([,v])=>v>0);return {sql:active.length?'('+active.map(([k])=>k+'>=?').join(s.popularMode==='all'?' AND ':' OR ')+')':'0',values:active.map(([,v])=>v)}}


