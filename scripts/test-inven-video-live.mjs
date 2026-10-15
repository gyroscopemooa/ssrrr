import {scanSource} from '../worker/adapters.mjs';
import {fetchPage} from '../worker/network.mjs';

const detailUrl='https://www.inven.co.kr/board/webzine/2097/2739468?my=chu';
const source={
  id:'live-inven-video-test',name:'인벤 영상 실검증',adapter:'generic',
  url:'https://www.inven.co.kr/board/webzine/2097',enabled:false,board:'영상',
  collectionMode:'AUTO',requiredFields:['title','sourceUrl','sourcePostId','body','image'],
  optionalFields:['video'],scanLimit:1,dailyLimit:1,preferNew:true,fallback:true,maxAgeDays:365,
  prefix:'',commentLimit:0,images:true,gifs:true,videos:true,intervalMinutes:180,
  minViews:0,minLikes:0,minComments:0,selection:'hybrid',weights:{likes:5,comments:3,views:.01},
  selectors:{item:'tr:has(a.subject-link)',title:'a.subject-link',link:'a.subject-link',body:'#powerbbsContent',comment:'.comment-content',views:'.view',likes:'.reco',comments:'.con-comment',date:'.date'},
  denyWords:[],mediaHosts:['inven.co.kr','upload3.inven.co.kr'],mediaFailure:'review_required'
};
const fakeList=`<table><tr><td><a class="subject-link" href="${detailUrl}">영상 실검증</a></td></tr></table>`;
const result=await scanSource(source,{fetcher:async(url,options)=>url===source.url?{type:'text/html; charset=utf-8',bytes:Buffer.from(fakeList)}:fetchPage(url,options)});
const item=result.items[0];
const videos=item?.blocks?.filter(block=>block.type==='video')||[];
console.log(JSON.stringify({mode:result.validation.mode,passed:result.validation.passed,media:result.validation.media,videoBlocks:videos.length,videos},null,2));
if(!result.validation.passed||videos.length!==1)process.exitCode=1;
