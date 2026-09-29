'use client';

type Row=Record<string,unknown>;
type Health='online'|'delayed'|'offline';

const workerRows=(rows:Row[])=>rows.filter(row=>!['scheduler','schedule-lock'].includes(String(row.id||'')));

function capabilities(row:Row){
 try{return JSON.parse(String(row.capabilities||'{}')) as Record<string,unknown>}
 catch{return {}}
}

function health(row:Row|undefined,now:number):Health{
 if(!row)return 'offline';
 const age=now-Number(row.last_seen_at||0);
 if(age<=60_000)return 'online';
 if(age<=180_000)return 'delayed';
 return 'offline';
}

function ago(row:Row|undefined,now:number){
 if(!row)return '연결 기록 없음';
 const seconds=Math.max(0,Math.floor((now-Number(row.last_seen_at||0))/1000));
 if(seconds<60)return `${seconds}초 전 응답`;
 const minutes=Math.floor(seconds/60);
 if(minutes<60)return `${minutes}분 전 응답`;
 const hours=Math.floor(minutes/60);
 if(hours<24)return `${hours}시간 전 응답`;
 return `${Math.floor(hours/24)}일 전 응답`;
}

function newest(rows:Row[]){
 return [...rows].sort((a,b)=>Number(b.last_seen_at||0)-Number(a.last_seen_at||0))[0];
}

function withActivity(row:Row|undefined,activityAt:number):Row|undefined{
 return row?{...row,last_seen_at:Math.max(Number(row.last_seen_at||0),activityAt)}:undefined;
}

const labels:Record<Health,string>={online:'정상',delayed:'응답 지연',offline:'꺼짐 · 확인 필요'};

export function SystemHealth({rows,now=Date.now(),activityAt=0}:{rows:Row[];now?:number;activityAt?:number}){
 const workers=workerRows(rows);
 const collector=withActivity(newest(workers.filter(row=>capabilities(row).collect===true)),activityAt);
 const vm=collector||withActivity(newest(workers),activityAt);
 const vmHealth=health(vm,now),workerHealth=health(collector,now);
 return <section className="ops-health" aria-label="자동 운영 상태">
  <article className={`ops-health-card is-${vmHealth}`}>
   <div className="ops-health-heading"><span className="ops-health-dot" aria-hidden="true"/><h2>Oracle VM 연결</h2></div>
   <strong>{labels[vmHealth]}</strong>
   <p>{ago(vm,now)}{vm?` · ${String(vm.id)}`:''}</p>
   <small>워커 신호로 확인합니다. 빨간색이면 Oracle에서 VM 전원도 확인하세요.</small>
  </article>
  <article className={`ops-health-card is-${workerHealth}`}>
   <div className="ops-health-heading"><span className="ops-health-dot" aria-hidden="true"/><h2>자동수집 워커</h2></div>
   <strong>{workerHealth==='online'?'켜짐':workerHealth==='delayed'?'응답 지연':'꺼짐'}</strong>
   <p>{ago(collector,now)}{collector?` · ${String(collector.id)}`:''}</p>
   <small>{workerHealth==='online'?'자동수집 작업을 받을 수 있습니다.':'자동수집 버튼을 눌러도 대기열에서 처리되지 않습니다.'}</small>
  </article>
 </section>
}
