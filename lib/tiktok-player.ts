export const TIKTOK_PLAYER_ORIGIN='https://www.tiktok.com';
export function playTikTokWithSound(target:Pick<Window,'postMessage'>|null){
 if(!target)return;
 for(const type of ['unMute','play'])target.postMessage({'x-tiktok-player':true,type},TIKTOK_PLAYER_ORIGIN);
}
export function isTikTokPlayerMessage(event:MessageEvent,target:Window|null){
 return !!target&&event.source===target&&event.origin===TIKTOK_PLAYER_ORIGIN&&event.data?.['x-tiktok-player']===true;
}
