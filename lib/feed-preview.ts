import type {Block} from './models';
import {visibleText} from './content-text';

export type FeedMedia={type:'image'|'video';src:string;youtube?:boolean};

export function feedPreview(body:string){
 let blocks:Block[]=[];
 try{const value=JSON.parse(body);if(Array.isArray(value))blocks=value}catch{}
 const seen=new Set<string>(),media:FeedMedia[]=[];
 for(const block of blocks){
  const item=block?.type==='image'?{type:'image' as const,src:'/api/media/'+block.id}:block?.type==='video'?{type:'video' as const,src:'/api/media/'+block.id}:block?.type==='youtube'?{type:'image' as const,src:'https://i.ytimg.com/vi/'+encodeURIComponent(block.videoId)+'/hqdefault.jpg',youtube:true}:null;
  if(item&&!seen.has(item.src)){seen.add(item.src);media.push(item)}
 }
 const images=media.filter(item=>item.type==='image').map(item=>item.src);
 return {
  excerpt:blocks.filter((b):b is Extract<Block,{type:'text'}>=>b?.type==='text'&&typeof b.text==='string').map(b=>visibleText(b.text).split('\n').filter(line=>!/^\s*(?:https?:\/\/\S+|(?:출처|ㅊㅊ)\s*[:：·].*)\s*$/u.test(line)).join(' ')).join(' ').replace(/\s+/g,' ').trim().slice(0,400),
  images:images.slice(0,6),imageCount:images.length,media:media.slice(0,6),mediaCount:media.length
 }
}
