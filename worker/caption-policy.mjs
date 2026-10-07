const ACCENT_TYPES=['post_body_scroll','comments','image_hold','image_scroll','gif_play','video_play'];
const ISSUE_TYPES=['post_title',...ACCENT_TYPES];
const LAUGHS=['ㅋㅋㅋㅋㅋ','ㅋㅋㅋㅋ','ㅎㅎㅎㅎ','ㅋㅋㅋㅋㅋㅋ','ㅋㅋㅋ','ㅋㅋㅋㅋㅋㅋㅋ'];
const SLOTS=[{x:'50%',r:-4},{x:'27%',r:5},{x:'73%',r:-6},{x:'50%',r:3}];

export function accentBursts(plan){
 const mode=plan.settings.laughCaptions||'normal',tone=plan.settings.captionTone||'humor';
 if(mode==='off'||tone==='serious')return [];
 const period=Math.round(Math.max(2,Number(plan.settings.laughIntervalSeconds)||(mode==='low'?7:5))*30),length=26,bursts=[];
 const eligible=tone==='issue'?ISSUE_TYPES:ACCENT_TYPES;
 let n=0;
 for(const scene of plan.scenes){
  if(!eligible.includes(scene.type))continue;
  for(let at=18;at+length<=scene.frames-8;at+=period){
   const found=/[ㅋㅎ]{2,}/.exec(scene.payload.text||'')?.[0];
   const text=tone==='issue'?'!!':found&&n%2===0?found.slice(0,8):LAUGHS[(n*5+3)%LAUGHS.length];
   bursts.push({from:scene.from+at,length,text,slot:SLOTS[n%SLOTS.length]});n++;
  }
 }
 return bursts;
}
