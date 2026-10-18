type Worker={last_seen_at?:unknown;capabilities?:unknown};
export function shortsWorkerReadiness(workers:Worker[],now=Date.now()){
 const recent=workers.filter(w=>Number(w.last_seen_at)>now-20*60*1000).flatMap(w=>{try{return [typeof w.capabilities==='string'?JSON.parse(w.capabilities):w.capabilities||{}]}catch{return []}});
 return {render:recent.some(c=>c.render===true),acquire:recent.some(c=>c.externalVideoDownload===true),subtitles:recent.some(c=>c.render===true&&c.speechSubtitles===true)};
}
