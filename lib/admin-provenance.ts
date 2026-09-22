import {getChatGPTUser} from '@/app/chatgpt-auth';
import {isAdmin} from './settings';
import {db} from './server';

// Never send collection provenance to regular members or anonymous visitors.
export async function adminSourceNames(ids:string[]):Promise<Record<string,string>>{
 if(!ids.length||!isAdmin(await getChatGPTUser()))return {};
 const rows=await db().prepare(`SELECT p.id,s.name,c.canonical_url FROM posts p JOIN auto_candidates c ON c.id=p.source_candidate LEFT JOIN auto_sources s ON s.id=c.source_id WHERE p.id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all<{id:string;name:string|null;canonical_url:string}>();
 return Object.fromEntries(rows.results.map(row=>{let name=row.name;try{name||=new URL(row.canonical_url).hostname}catch{}return [row.id,name||'알 수 없는 사이트'];}));
}
