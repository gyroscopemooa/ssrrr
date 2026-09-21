import {load} from 'cheerio';
// Only the same public read endpoints used by each page; no authentication or challenge bypass.
export async function publicComments(detail,html,source,fetcher){
 if(!source.commentLimit||detail.comments.length)return detail;
 const u=new URL(detail.url);let comments;
 if(u.hostname==='theqoo.net'&&html.includes('loadReply(')){
  const id=html.match(/loadReply\((\d+),/)?.[1];if(!id)throw Error('COMMENT_PARSE_FAILED: theqoo document');
  const r=await fetcher(u.origin+'/index.php',{method:'POST',contentType:'application/json; charset=utf-8',body:JSON.stringify({act:'dispTheqooContentCommentListTheqoo',document_srl:id,cpage:0}),referer:detail.url});
  const data=JSON.parse(r.bytes.toString());if(!Array.isArray(data.comment_list))throw Error('COMMENT_PARSE_FAILED: theqoo response');comments=data.comment_list.map(c=>({id:String(c.srl),html:c.ct||c.content||c.text||''}));
 }else if(u.hostname==='www.inven.co.kr'&&html.includes('PwCMT.constructor')){
  const comeidx=html.match(/comeidx\s*:\s*['"](\w+)['"]/)?.[1],articlecode=html.match(/articlecode\s*:\s*(\d+)/)?.[1];if(!comeidx||!articlecode)throw Error('COMMENT_PARSE_FAILED: inven identifiers');
  const r=await fetcher(u.origin+'/common/board/comment.json.php',{method:'POST',body:new URLSearchParams({comeidx,articlecode,sortorder:'date',act:'list',out:'json',replynick:'',replyidx:'0'}).toString(),referer:detail.url});const data=JSON.parse(r.bytes.toString());if(!Array.isArray(data.commentlist))throw Error('COMMENT_PARSE_FAILED: inven response');comments=data.commentlist.flatMap(group=>group.list||[]).map(c=>({id:String(c.__attr__?.cmtidx||c.o_idx||c.idx),html:c.o_comment||c.comment||''}));
 }
 if(comments)detail.comments=comments.map(c=>{const $=load(c.html);$('script,style,button').remove();$('br').replaceWith('\n');return {id:c.id,text:$.text().trim().slice(0,2000)}}).filter(c=>c.text).slice(0,source.commentLimit);
 return detail;
}
