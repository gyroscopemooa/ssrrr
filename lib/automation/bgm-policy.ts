type Settings = {bgmEnabled?:boolean;bgmRandom?:boolean;bgmId?:string;humorBgmIds?:string[];issueBgmId?:string;issueBgmIds?:string[];captionTone?:'humor'|'issue'|'serious'};
type Asset = {id?:unknown;type?:unknown;license_note?:unknown};

// Resolve on the server so render workers without random selection receive a track too.
export function resolveBgmSettings<T extends Settings>(settings:T,assets:Asset[],random= Math.random):T{
 const pool=assets.filter(a=>a.type==='bgm'&&typeof a.id==='string'&&typeof a.license_note==='string'&&a.license_note.trim());
 if(settings.bgmEnabled&&settings.captionTone&&settings.captionTone!=='humor'){
  const dedicatedIds=[...(settings.issueBgmIds||[]),...(settings.issueBgmId?[settings.issueBgmId]:[])];
  const dedicatedPool=pool.filter(a=>dedicatedIds.includes(String(a.id)));
  const dedicated=dedicatedPool[Math.floor(random()*dedicatedPool.length)];
  const current=pool.find(a=>a.id===settings.bgmId);
  const fallback=current||pool[Math.floor(random()*pool.length)];
  return {...settings,bgmRandom:false,bgmId:String(dedicated?.id||fallback?.id||'')};
 }
 if(!settings.bgmEnabled||!settings.bgmRandom)return settings;
 const issueIds=[...(settings.issueBgmIds||[]),...(settings.issueBgmId?[settings.issueBgmId]:[])];
 const humorPool=settings.humorBgmIds?.length?pool.filter(a=>settings.humorBgmIds?.includes(String(a.id))):pool.filter(a=>!issueIds.includes(String(a.id)));
 if(!humorPool.length)return settings;
 return {...settings,bgmId:String(humorPool[Math.floor(random()*humorPool.length)].id)};
}
