 'use client';
import {useState} from 'react';
import {api} from '@/app/community';
type Row=Record<string,unknown>;
export function SourceNote({row,onSaved}:{row:Row;onSaved:()=>Promise<void>}){
 const [editing,setEditing]=useState(false),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const reason=String(row.validation_error||''),passed=!!row.can_enable,pending=['검사 대기','검사 중'].includes(String(row.validation_status));
 let config:Row={};try{config=JSON.parse(String(row.config||'{}'))}catch{}
 const suggestions:string[]=[];
 if(!passed){
 if(/REQUIRED_FIELDS_MISSING|REQUIRED_FIELD_DISABLED/.test(reason))suggestions.push('반드시 필요한 데이터와 현재 수집 방식을 확인하세요. 본문·이미지가 필요한데 없으면 통과할 수 없습니다. 링크 모음으로 운영할 때만 필수를 제목·URL·ID로 바꾸고 다시 검사하세요.');
 if(/SELECTOR_MISMATCH/.test(reason))suggestions.push('주소가 실제 목록 페이지인지 먼저 확인 → 기본 규칙 적용 또는 사이트별 추출 선택자 수정 → 다시 검사. 보통 수정 여지가 있습니다.');
 if(/DC public comment|COMMENT|PARSING_UNVERIFIED:.*comments/.test(reason)&&config.commentLimit!==0)suggestions.push('댓글이 필요 없으면 가져올 댓글 수를 0으로 저장 → 다시 검사. 본문·미디어도 통과해야 켤 수 있습니다.');
 if(/MEDIA_HOST/.test(reason))suggestions.push('실제 이미지·영상 서버를 허용 미디어 도메인에 추가 → 다시 검사.');
 if(/MEDIA_INVALID|PARSING_UNVERIFIED:.*media/.test(reason))suggestions.push('미디어 추출 방식 확인. 텍스트만 필요하면 사진·동영상 수집을 모두 OFF로 저장 → 다시 검사.');
 if(/HTTP 404|UNSAFE_URL/.test(reason))suggestions.push('목록 주소·프로토콜·이동 주소 확인 → 올바른 주소 저장 → 다시 검사. 주소를 바꾸기만 하면 통과한다고 보장할 수는 없습니다.');
 if(/robots\.txt|HTTP 403/.test(reason))suggestions.push('현재 요청 경로 접근 제한. 허용된 제공 경로·운영자 허가 확인 필요. 댓글 OFF만으로 본문 차단까지 해결되지는 않습니다.');
 if(/HTTP 406/.test(reason))suggestions.push('서버가 요청을 거절했습니다. 주소와 정상 요청 형식 확인이 먼저입니다.');
 }
 async function save(){setBusy(true);setMessage('');try{await api('/api/ops',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sourceNote',id:row.id,note})});setEditing(false);setMessage('메모 저장 완료');await onSaved()}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <aside className="ops-source-note" aria-label={String(row.name)+' 해결 메모'}><strong>해결 메모</strong>
 {passed?<p>확인됨: 현재 저장된 설정으로 검사 통과{config.commentLimit===0?' · 댓글 없이 수집':''}{config.images===false&&config.videos===false?' · 사진·동영상 없이 수집':''}.</p>:<><small>{pending?'이전 오류 기준 제안 · 현재 검사 진행 중':'재검사 제안 · 아직 통과 확인 전'}</small>{suggestions.length?<ul>{suggestions.map(s=><li key={s}>{s}</li>)}</ul>:<p>검사 결과에 맞는 조치를 메모해 두세요. 원인이 불명확하면 다른 수집 방법 검토가 필요합니다.</p>}</>}
 <div className="ops-saved-note">{String(row.source_note||'직접 남긴 메모가 없습니다.')}</div>
 {editing?<><textarea aria-label={String(row.name)+' 운영 메모'} maxLength={1500} rows={3} value={note} disabled={busy} onChange={e=>setNote(e.target.value)} placeholder="예: 댓글 0으로 통과 / 새 주소로 재검사 필요"/><button disabled={busy} onClick={()=>void save()}>메모 저장</button><button disabled={busy} onClick={()=>setEditing(false)}>취소</button></>:<button onClick={()=>{setNote(String(row.source_note||''));setMessage('');setEditing(true)}}>메모 {row.source_note?'수정':'추가'}</button>}
 {message&&<p role="status">{message}</p>}
 </aside>
}
