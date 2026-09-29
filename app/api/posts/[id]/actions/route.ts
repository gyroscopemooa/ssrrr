import {contentReviewScan} from '@/lib/automation/policy';
import {wrap,db,guard,json,cleanText,quota,HttpError} from '@/lib/server';
import {settings} from '@/lib/settings';

export const POST=wrap(async req=>{
 const u=await guard(req),d=await json(req),id=new URL(req.url).pathname.split('/').at(-2)!;
 if(!await db().prepare('SELECT id FROM posts WHERE id=? AND hidden=0').bind(id).first())throw new HttpError(404,'없는 글입니다.');
 if(d.action==='like'){
  if(typeof d.liked!=='boolean')throw new HttpError(400,'추천 상태를 확인해 주세요.');
  await quota(u.userId,'actions',200);
  await db().prepare(d.liked?'INSERT OR IGNORE INTO likes(post_id,owner) VALUES(?,?)':'DELETE FROM likes WHERE post_id=? AND owner=?').bind(id,u.userId).run();
  if(d.liked){
   const post=await db().prepare('SELECT title,body,category FROM posts WHERE id=?').bind(id).first<{title:string;body:string;category:string}>();
   if(post?.category==='스르륵 유머'){
    const count=await db().prepare('SELECT COUNT(*) AS count FROM likes WHERE post_id=?').bind(id).first<{count:number}>();
    if((count?.count||0)>=(await settings()).settings.srrrPromotionLikes){
     const scan=contentReviewScan(post.title+'\n'+post.body);
     if(scan.status==='passed')await db().prepare("UPDATE posts SET category='유머',topic='' WHERE id=? AND category='스르륵 유머'").bind(id).run();
     else if(!await db().prepare("SELECT id FROM reports WHERE post_id=? AND owner='system:promotion'").bind(id).first())await db().prepare('INSERT INTO reports(id,post_id,owner,reason,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,'system:promotion','오늘의 유머 승격 검토: '+scan.reasons.join(', '),Date.now()).run();
    }
   }
  }
 }else if(d.action==='comment'){
  const account=await db().prepare('SELECT nickname FROM members WHERE owner=?').bind(u.userId).first<{nickname:string}>();
  if(!account)throw new HttpError(403,'로그인 후 댓글을 작성할 수 있습니다.');
  await quota(u.userId,'comments',100);
  await db().prepare('INSERT INTO comments(id,post_id,owner,nickname,body,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,u.userId,account.nickname,cleanText(d.body,2000),Date.now()).run();
 }else if(d.action==='deleteComment')await db().prepare('DELETE FROM comments WHERE id=? AND post_id=? AND owner=?').bind(cleanText(d.id,40),id,u.userId).run();
 else if(d.action==='report'){await quota(u.userId,'reports',20);await db().prepare('INSERT INTO reports(id,post_id,owner,reason,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,u.userId,cleanText(d.reason,500),Date.now()).run()}
 else throw new HttpError(400,'지원하지 않는 요청입니다.');
 return Response.json({ok:true});
});
