import {sourceSchema} from './config';
const sites=[['엠봉','https://mbong.kr/best'],['개드립','https://www.dogdrip.net/dogdrip'],['개집넷','https://gezip.net/bbs/board.php?bo_table=best'],['오늘의유머','https://www.todayhumor.co.kr/board/list.php?table=bestofbest'],['FM코리아','https://www.fmkorea.com/best'],['보배드림','https://www.bobaedream.co.kr/list?code=best'],['뽐뿌','https://www.ppomppu.co.kr/zboard/zboard.php?id=humor'],['인스티즈','https://www.instiz.net/pt'],['클리앙','https://www.clien.net/service/recommend'],['와이고수','https://www.ygosu.com/community/real_article'],['MLBPARK','https://mlbpark.donga.com/mp/b.php?b=bullpen'],['더쿠','https://theqoo.net/hot'],['루리웹','https://bbs.ruliweb.com/best'],['인벤','https://www.inven.co.kr/board/webzine/2097'],['아카라이브','https://arca.live/b/singbung'],['이토랜드','https://www.etoland.co.kr/bbs/board.php?bo_table=etohumor']];
const galleries=[['막갤','makjang'],['코갤','korea'],['야갤','baseball_new11'],['인방갤','ib_new2'],['우울갤','depression'],['롤갤','leagueoflegends6'],['치지직','chzzk'],['싱글벙글','singlebungle1472'],['해축갤','football_new9'],['주갤','neostock']];
export const sourceCatalog=[...sites.map(([name,url],i)=>sourceSchema.parse({id:'source-'+i,name,url,selectors:{item:'tr, article, .list_item',title:'.title, .subject, .title_link, .list_subject',link:'a',body:'.xe_content, .view_content, #writeContents, .content_view, article',comment:'.comment-content, .comment_content',views:'.readNum, .hit',likes:'.voteNum, .recommend',comments:'.replyNum, .comment_count',date:'time, .date'}})),...galleries.map(([name,id])=>sourceSchema.parse({id:'dc-'+id,name,adapter:'dcinside',url:'https://gall.dcinside.com/board/lists/?id='+id+'&exception_mode=recommend',prefix:'['+name+' 베스트] ',selectors:{item:'tr.ub-content',title:'.gall_tit a:not(.reply_numbox)',link:'.gall_tit a:not(.reply_numbox)',body:'.write_div',comment:'.usertxt',views:'.gall_count',likes:'.gall_recommend',comments:'.reply_num',date:'.gall_date'}}))];

// Verified HTML regions; remaining entries stay OFF until their own test passes.
const verified:Record<string,Partial<(typeof sourceCatalog)[number]>>={
'source-2':{mediaHosts:['gezip.net'],selectors:{item:'li.list-item:not(:has(.wr-notice))',title:'a.item-subject',link:'a.item-subject',body:'.view-content',comment:'[id^=c_] .media-content',views:'.wr-hit',likes:'.wr-good',comments:'.count',date:'.wr-date'}},
'source-3':{mediaHosts:['todayhumor.co.kr'],selectors:{item:'tr.view',title:'td.subject a',link:'td.subject a',body:'.viewContent',comment:'.memoContent',views:'.hits',likes:'.oknok',comments:'.list_memo_count_span',date:'.date'}},
'source-7':{mediaHosts:['instiz.net'],selectors:{item:'tr:has(.listsubject)',title:'.listsubject a',link:'.listsubject a',body:'#memo_content_1',comment:'.comment_content',views:'td.listno:nth-last-child(2)',likes:'td.listno:last-child',comments:'.cmt3',date:'td.listno:first-of-type'}},
'source-11':{mediaHosts:['theqoo.net','img.theqoo.net'],selectors:{item:'tr:not(.notice):has(td.title)',title:'td.title a:not(.replyNum)',link:'td.title a:not(.replyNum)',body:'.xe_content',comment:'.comment-content',views:'.m_no',likes:'.voteNum',comments:'.replyNum',date:'.time'}},
'source-13':{mediaHosts:['inven.co.kr'],selectors:{item:'tr:has(a.subject-link)',title:'a.subject-link',link:'a.subject-link',body:'#powerbbsContent',comment:'.comment-content',views:'.view',likes:'.reco',comments:'.con-comment',date:'.date'}}};
for(const item of sourceCatalog)Object.assign(item,verified[item.id!]);

// Canonical gallery routes and source-specific selectors verified in production-readiness audit.
const corrections:Record<string,Partial<(typeof sourceCatalog)[number]>>={
'dc-makjang':{url:'https://gall.dcinside.com/board/lists/?id=accident_new&exception_mode=recommend'},
'dc-korea':{url:'https://gall.dcinside.com/board/lists/?id=comedy_new1&exception_mode=recommend'},
'dc-baseball_new11':{url:'https://gall.dcinside.com/board/lists/?id=baseball_new13&exception_mode=recommend'},
'dc-chzzk':{url:'https://gall.dcinside.com/mgallery/board/lists/?id=chzzk&exception_mode=recommend'},
'dc-singlebungle1472':{url:'https://gall.dcinside.com/mgallery/board/lists/?id=singlebungle1472&exception_mode=recommend'},
'source-9':{url:'https://ygosu.com/community/real_article'},
'source-1':{mediaHosts:['dogdrip.net'],selectors:{item:'li.webzine',title:'a.title-link',link:'a.title-link',body:'.xe_content',comment:'.comment-content .xe_content',views:'.view-count',likes:'.list-meta .text-primary:last-child',comments:'h5.title .text-primary',date:'.list-meta .text-muted'}},
'source-4':{mediaHosts:['image.fmkorea.com'],selectors:{item:'li.li',title:'h3.title a',link:'h3.title a',body:'.xe_content',comment:'.comment-content',views:'.readNum',likes:'.pc_voted_count .count',comments:'.comment_count',date:'.regdate'}},
'source-12':{mediaHosts:['ruliweb.com','ruliweb.net'],selectors:{item:'tr.table_body:not(.best_top_row)',title:'.subject_link',link:'.subject_link',body:'.view_content',comment:'.comment_view .text',views:'.hit',likes:'.recomd',comments:'.num_reply',date:'.time'}},
'source-14':{mediaHosts:['arca.live','namu.la','namu.wiki'],selectors:{item:'a.vrow:not(.notice)',title:'.title',link:':self',body:'.article-content',comment:'.comment-wrapper .text',views:'.col-view',likes:'.col-rate',comments:'.comment-count',date:'time'}}};
for(const item of sourceCatalog){Object.assign(item,corrections[item.id!]);if(item.adapter==='dcinside')item.mediaHosts=['dcinside.co.kr','dcinside.com','i.ytimg.com','imgnews.pstatic.net'];}

for(const item of sourceCatalog){if(item.id==='source-0'){item.selectors.comment='.cmt_body > .xe_content';item.mediaHosts=['mbong.kr'];}if(item.id==='source-13')item.selectors.item='tr:not(.notice):has(a.subject-link)';}

for(const item of sourceCatalog)if(item.id==='source-11')item.mediaHosts.push('pbs.twimg.com');

sourceCatalog.push(sourceSchema.parse({id:'source-16',name:'웃긴대학',url:'https://web.humoruniv.com/board/humor/board_best.html',mediaHosts:['down.humoruniv.com'],selectors:{item:'tr[id^="li_chk_"]',title:'.li_sbj [id^="title_chk_"]',link:'.li_sbj a[href*="read.html"]',body:'#wrap_copy',comment:'tr[id^="comment_span_"] .comment_more',views:'td.li_und:nth-last-child(3)',likes:'td.li_und .o',comments:'.list_comment_num',date:'.li_date'}}));
