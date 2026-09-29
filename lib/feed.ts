import {adminSourceNames} from '@/lib/admin-provenance';
import {feedPreview} from '@/lib/feed-preview';
import {popularPredicate} from '@/lib/models';
import {db} from '@/lib/server';
import {settings} from '@/lib/settings';
import {normalizeStoredEconomyPost} from '@/lib/automation/mail-normalize';

export type FeedQuery={board?:string;sort?:string;q?:string;offset?:number;scope?:string;preview?:string;hidden?:number};
type FeedRow={id:string;title:string;nickname:string;category:string;topic:string;thumbnail?:string;body:string;created_at:number;views:number;likes:number;comments:number;promotionReview:number};

export async function getFeed(query:FeedQuery={}){
 const popular=query.sort==='popular'&&query.board!=='경제',sitePopular=popular&&query.scope==='site',requestedBoard=query.board||'전체';
 const board=popular&&!sitePopular&&requestedBoard==='전체'?'유머':requestedBoard,q=(query.q||'').slice(0,100),offset=Math.floor(Math.min(10000,Math.max(0,query.offset||0)));
 const s=(await settings()).settings,popularKind=sitePopular?'site':requestedBoard==='유머'?'today':requestedBoard==='스르륵 유머'?'srrr':'site',rule=popularPredicate(s,popularKind),limit=popular?(query.preview==='sidebar'?10:rule.limit):20,cutoff=rule.days?Date.now()-rule.days*86400000:0;
 const categoryFilter=requestedBoard==='전체'||sitePopular?" AND p.category<>'경제'":'',filter=popular?' AND created_at>=? AND '+rule.sql:'';
 const values:(string|number)[]=[query.hidden||0,board,board,'%'+q+'%'];if(popular)values.push(cutoff,...rule.values);values.push(limit+1,offset);
 const rows=await db().prepare("SELECT * FROM (SELECT p.id,p.title,COALESCE(CASE WHEN p.category='스르륵 유머' AND p.system_author='system:auto' THEN '스르륵' WHEN p.system_author='system:auto' THEN '꿀잼픽' ELSE (SELECT display_name FROM system_profiles WHERE id=p.system_author) END,p.nickname) nickname,p.category,p.topic,p.thumbnail,p.body,p.created_at,p.views,(SELECT COUNT(*) FROM likes WHERE post_id=p.id) AS likes,(SELECT COUNT(*) FROM comments WHERE post_id=p.id) AS comments,CASE WHEN p.category='스르륵 유머' THEN (SELECT COUNT(*) FROM reports WHERE post_id=p.id AND owner='system:promotion') ELSE 0 END AS promotionReview FROM posts p WHERE p.hidden=? AND (?='전체' OR p.category=?)"+categoryFilter+" AND p.title LIKE ?) WHERE 1=1"+filter+" ORDER BY "+(popular?'likes DESC,comments DESC,views DESC,created_at DESC':'created_at DESC')+" LIMIT ? OFFSET ?").bind(...values).all<FeedRow>();
 const sources=await adminSourceNames(rows.results.slice(0,limit).map(row=>String(row.id)));
 return {posts:rows.results.slice(0,limit).map(({body,...post})=>{const clean=post.category==='경제'?normalizeStoredEconomyPost(post.title,String(body||'[]')):null;return {...post,...(clean?{title:clean.title,content:clean.text}:{}),...(sources[String(post.id)]?{adminSourceName:sources[String(post.id)]}:{}),...feedPreview(clean?.body||String(body||'[]'))}}),more:rows.results.length>limit,pageSize:limit,settings:s,board,sort:popular?'popular':'latest',sitePopular,q,offset};
}
