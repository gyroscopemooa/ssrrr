import {getChatGPTUser} from '@/app/chatgpt-auth';
import {isAdmin} from './settings';
import {db} from './server';

export type AdminSource={name:string;url:string};

// Never send collection provenance to regular members or anonymous visitors.
export async function adminSourceInfo(ids:string[]):Promise<Record<string,AdminSource>>{
 if(!ids.length||!isAdmin(await getChatGPTUser()))return {};
 const rows=await db().prepare(`SELECT p.id,s.name,c.canonical_url FROM posts p JOIN auto_candidates c ON c.id=p.source_candidate LEFT JOIN auto_sources s ON s.id=c.source_id WHERE p.id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all<{id:string;name:string|null;canonical_url:string}>();
 return Object.fromEntries(rows.results.map(row=>{let name=row.name;try{name||=new URL(row.canonical_url).hostname}catch{}return [row.id,{name:name||'알 수 없는 사이트',url:/^https?:\/\//.test(row.canonical_url||'')?row.canonical_url:''}];}));
}

export async function adminSourceNames(ids:string[]):Promise<Record<string,string>>{
 return Object.fromEntries(Object.entries(await adminSourceInfo(ids)).map(([id,s])=>[id,s.name]));
}
