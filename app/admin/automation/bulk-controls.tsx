 'use client';
import {useState,type ReactNode} from 'react';
import {api} from '@/app/community';
import {sourceSchema} from '@/lib/automation/config';
type Row=Record<string,unknown>;
const fields:Record<string,string>={collectionMode:'수집 방식',requiredFields:'필수 데이터',commentLimit:'댓글 수',images:'사진 수집',videos:'동영상 수집',gifs:'GIF 수집',scanLimit:'스캔 개수',dailyLimit:'하루 게시 수',intervalMinutes:'수집 간격',minViews:'최소 조회',minLikes:'최소 추천',minComments:'최소 댓글',maxAgeDays:'후보 보관 기간',preferNew:'새 후보 우선',fallback:'과거 후보 허용',board:'게시판',prefix:'제목 접두어',selection:'글 선택 순서',mediaFailure:'미디어 실패 처리',denyWords:'금칙어',weights:'인기 점수 가중치'};
const defaults=sourceSchema.parse({name:'일괄 설정',url:'https://example.com'}) as Row;
export function BulkControls({rows,selected,onSelect,busy,onBusy,locked,onSaved,renderFields}:{rows:Row[];selected:string[];onSelect:(ids:string[])=>void;busy:boolean;onBusy:(b:boolean)=>void;locked:boolean;onSaved:()=>Promise<void>;renderFields:(v:Row,change:(v:Row)=>void)=>ReactNode}){
 const [patch,setPatch]=useState<Row>({}),[results,setResults]=useState<{id:string;status:string;reason:string}[]>([]),[error,setError]=useState('');
 const ids=selected.filter(id=>rows.some(r=>r.id===id)),disabled=busy||locked;
 async function run(mode:string,targets:string[],changes:Row={}){if(!targets.length)return;
 if(mode==='settings'&&!window.confirm('선택한 '+targets.length+'개 사이트의 '+Object.keys(changes).map(k=>fields[k]).join(', ')+' 설정을 변경할까요? 댓글·미디어 조건이 바뀌면 OFF로 전환되고 재검사가 필요합니다.'))return;
 onBusy(true);setError('');setResults([]);try{const response=await api<{results:{id:string;status:string;reason:string}[]}>('/api/ops',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sourcesBulk',ids:targets,mode,...(mode==='settings'?{patch:changes}:{})})});setResults(response.results);await onSaved()}catch(e){setError((e as Error).message)}finally{onBusy(false)}}
 return <section className="ops-bulk" aria-label="전체 조작판"><h2>전체 조작판</h2><p>대상 사이트를 체크하고 원하는 작업을 누르세요. 현재 {rows.length}개 중 <strong>{ids.length}개 선택</strong></p>
 {locked&&<p role="status">열려 있는 개별 수집 조건을 저장하거나 닫은 뒤 사용하세요.</p>}
 <div className="ops-actions"><button disabled={disabled} onClick={()=>onSelect(rows.map(r=>String(r.id)))}>전체 선택</button><button disabled={disabled} onClick={()=>onSelect(rows.filter(r=>!r.can_enable).map(r=>String(r.id)))}>통과한 사이트 제외하고 선택</button><button disabled={disabled} onClick={()=>onSelect([])}>선택 해제</button></div>
 <div className="ops-actions"><button className="primary" disabled={disabled||!ids.length} onClick={()=>void run('test',ids)}>선택한 {ids.length}개 테스트</button><button disabled={disabled||!rows.length} onClick={()=>{if(window.confirm('통과한 사이트도 포함해 전체 '+rows.length+'개를 검사할까요? 재검사 실패 시 OFF로 전환됩니다.'))void run('test',rows.map(r=>String(r.id)))}}>전체 테스트 ({rows.length}개)</button><button disabled={disabled||!ids.length} onClick={()=>void run('settings',ids,{commentLimit:0})}>선택한 사이트 댓글 해제</button><button disabled={disabled||!ids.length} onClick={()=>void run('off',ids)}>선택한 사이트 수집 OFF</button></div>
 <details><summary>선택한 사이트의 수집 조건 일괄 변경</summary><p>바꿀 항목만 체크하세요. 체크하지 않은 설정과 사이트별 주소·추출 규칙은 유지됩니다.</p><div className="ops-bulk-keys">{Object.entries(fields).map(([k,label])=><label key={k}><input type="checkbox" disabled={disabled} checked={k in patch} onChange={e=>setPatch(p=>{const n={...p};if(e.target.checked)n[k]=k==='requiredFields'?['title','sourceUrl','sourcePostId','body','image']:defaults[k];else delete n[k];return n})}/>{label}</label>)}</div>
 <fieldset disabled={disabled}>{renderFields(patch,setPatch)}</fieldset><button className="primary" disabled={disabled||!ids.length||!Object.keys(patch).length} onClick={()=>void run('settings',ids,patch)}>선택한 {ids.length}개에 체크한 설정 적용</button></details>
 {error&&<p className="ops-add-error" role="alert">{error}</p>}{results.length>0&&<div role="status"><p>처리 {results.filter(r=>r.status!=='skipped').length}개 · 건너뜀 {results.filter(r=>r.status==='skipped').length}개</p><ul>{results.map(r=><li key={r.id}>{String(rows.find(s=>s.id===r.id)?.name||r.id)}: {r.reason}</li>)}</ul></div>}
 </section>
}
