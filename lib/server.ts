import {ZodError} from 'zod';
import {splitLinks,safeLink,youtubeId,type Block} from './models';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function db(){if(!env.DB)throw new HttpError(503,'게시판 연결을 준비하고 있어요. 잠시 후 다시 시도해 주세요.');return env.DB}
export function bucket(){if(!env.BUCKET)throw new HttpError(503,'이미지 저장소에 연결할 수 없습니다.');return env.BUCKET}
export async function guard(req:Request){const user=await getChatGPTUser();if(!user)throw new HttpError(401,'로그인 후 이용해 주세요.');const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new HttpError(403,'요청 출처를 확인할 수 없습니다.');return user}
export async function quota(owner:string,kind:string,max:number){const key=owner+':'+kind+':'+new Date().toISOString().slice(0,10);const row=await db().prepare('INSERT INTO quotas(id,count) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count').bind(key,max).first();if(!row)throw new HttpError(429,'오늘 이용 한도에 도달했습니다. 내일 다시 이용해 주세요.')}
export function wrap(fn:(req:Request)=>Promise<Response>){return async(req:Request)=>{try{return await fn(req)}catch(e){if(e instanceof ZodError)return Response.json({error:e.issues.map(x=>x.path.join('.')+': '+x.message).join('; ')},{status:400});if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status});console.error('community_request_failed',e);return Response.json({error:'요청을 처리하지 못했습니다. 작성 내용은 유지됩니다. 다시 시도해 주세요.'},{status:503})}finally{if(req.body&&!req.body.locked)await bounded(req.body,160000).catch(()=>{})}}}
export async function json(req:Request){const raw=await bounded(req.body,160000);try{return JSON.parse(new TextDecoder().decode(raw))}catch{throw new HttpError(400,'입력 형식을 확인해 주세요.')}}
export async function bounded(stream:ReadableStream<Uint8Array>|null,max:number){if(!stream)throw new HttpError(400,'내용이 없습니다.');const reader=stream.getReader();const parts:Uint8Array[]=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw new HttpError(413,'파일 또는 본문이 너무 큽니다.');parts.push(value)}}finally{await reader.cancel().catch(()=>{})}const out=new Uint8Array(size);let pos=0;for(const v of parts){out.set(v,pos);pos+=v.length}return out}
export function cleanText(v:unknown,max:number,min=1){if(typeof v!=='string'||v.trim().length<min||v.length>max)throw new HttpError(400,'입력 길이를 확인해 주세요.');return v.trim()}
export type {Block} from './models';
export async function content(value:unknown,ownerInput:string|string[]){const owners=[...new Set(Array.isArray(ownerInput)?ownerInput:[ownerInput])];
 if(!Array.isArray(value)||value.length>200)throw new HttpError(400,'본문 형식을 확인해 주세요.');
 const blocks:Block[]=[];let chars=0;
 for(const b of value){if(!b||typeof b!=='object')throw new HttpError(400,'본문 형식을 확인해 주세요.');
 if(b.type==='text'&&typeof b.text==='string'){chars+=b.text.length;blocks.push(...splitLinks(b.text))}
 else if((b.type==='image'||b.type==='video')&&typeof b.id==='string'&&/^[a-f0-9-]{36}$/.test(b.id))blocks.push({type:b.type,id:b.id});
 else if(b.type==='youtube'&&typeof b.videoId==='string'&&/^[\w-]{11}$/.test(b.videoId))blocks.push({type:'youtube',videoId:b.videoId});
 else if(b.type==='link'&&typeof b.url==='string'&&safeLink(b.url)){const videoId=youtubeId(b.url);blocks.push(videoId?{type:'youtube',videoId}:{type:'link',url:safeLink(b.url)!})}
 else throw new HttpError(400,'저장되지 않았거나 지원하지 않는 자료가 있습니다.');
 }
 if(chars>30000||!blocks.length||blocks.length>250)throw new HttpError(400,'본문은 30,000자 이내로 작성해 주세요.');
 const attachments=blocks.filter((b):b is Extract<Block,{type:'image'|'video'}>=>b.type==='image'||b.type==='video');const ids=[...new Set(attachments.map(b=>b.id))];
 if(ids.length>20||blocks.filter(b=>b.type==='link'||b.type==='youtube').length>10)throw new HttpError(400,'첨부는 20개, 링크는 10개까지 가능합니다.');
 if(ids.length){const r=await db().prepare('SELECT id,type FROM media WHERE owner IN ('+owners.map(()=>'?').join(',')+') AND id IN ('+ids.map(()=>'?').join(',')+')').bind(...owners,...ids).all<{id:string;type:string}>();
 if(r.results.length!==ids.length||attachments.some(b=>!r.results.some(m=>m.id===b.id&&m.type.startsWith(b.type+'/'))))throw new HttpError(400,'첨부파일 소유권과 종류를 확인해 주세요.');}
 return blocks;
}

export function sourceUrl(v:unknown){if(!v)return '';if(typeof v!=='string'||v.length>2000)throw new HttpError(400,'출처 주소를 확인해 주세요.');try{const u=new URL(v);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw 0;return u.href}catch{throw new HttpError(400,'출처에는 http 또는 https 주소를 넣어 주세요.')}}





