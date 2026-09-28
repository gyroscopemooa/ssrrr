export type ShortsSourceBlock={type:string;text?:string};

const mediaTypes=new Set(['image','video','youtube']);

export function mayAutoCombine(blocks:ShortsSourceBlock[],category:string){
 const hasMedia=blocks.some(block=>mediaTypes.has(block.type));
 const hasText=blocks.some(block=>block.type==='text'&&Boolean(block.text?.trim()));
 return category!=='경제'&&!hasMedia&&hasText;
}
