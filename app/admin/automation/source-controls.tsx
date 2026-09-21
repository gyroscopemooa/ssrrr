'use client';
import {ModeStatus} from './mode-status';
import {useState} from 'react';import {sourceCatalog} from '@/lib/automation/catalog';import {sourceSchema} from '@/lib/automation/config';import {api} from '@/app/community';
export function AddSource({onSaved}:{onSaved:()=>Promise<void>}){const [open,setOpen]=useState(false),[name,setName]=useState(''),[url,setUrl]=useState(''),[template,setTemplate]=useState('auto'),[busy,setBusy]=useState(false),[error,setError]=useState('');async function save(test:boolean){setBusy(true);setError('');try{if(!url.trim())throw Error('목록 첫 페이지 주소를 입력하세요.');let address:URL;try{address=new URL(url.trim())}catch{throw Error('전체 주소를 입력하세요. 예: https://사이트주소/게시판');}if(address.protocol!=='https:')throw Error('https로 시작하는 목록 주소를 넣어주세요.');if(template==='dc'&&(address.hostname!=='gall.dcinside.com'||!address.pathname.includes('/lists')||!address.searchParams.get('id')))throw Error('디시 갤러리의 목록 주소를 넣어주세요. 일반갤·마이너갤 모두 가능합니다.');if(!name.trim())throw Error('관리 화면에 표시할 이름을 입력하세요.');const selected=template==='auto'?(address.hostname==='gall.dcinside.com'?'dc':sourceCatalog.find(s=>new URL(s.url).hostname===address.hostname)?.id||'custom'):template;if(selected==='dc'&&(!address.pathname.includes('/lists')||!address.searchParams.get('id')))throw Error('디시 글 상세 주소가 아닌 갤러리 목록 주소를 넣어주세요.');const preset=selected==='dc'?sourceCatalog.find(s=>s.adapter==='dcinside'):sourceCatalog.find(s=>s.id===selected);const source=sourceSchema.parse({...preset,id:undefined,name:name.trim(),url:address.href,enabled:false,prefix:''});await api('/api/ops',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'source',source,testAfterSave:test})});setOpen(false);setName('');setUrl('');await onSaved()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}return <><button type="button" className="primary" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>+ 수집 사이트 추가</button>{open&&<form className="ops-editor" noValidate onSubmit={e=>{e.preventDefault();void save(true)}}><h2>새 수집 사이트</h2><label>표시 이름<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 내가 보는 갤러리"/></label><label>목록 첫 페이지 주소<input required type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://사이트주소/게시판"/></label><label>수집 규칙<select value={template} onChange={e=>setTemplate(e.target.value)}><option value="auto">주소로 자동 선택 (모르면 이 항목)</option><option value="dc">디시 공통 (일반갤·마이너갤)</option><option value="custom">기타 사이트 (추출 규칙 직접 설정)</option>{sourceCatalog.filter(s=>s.adapter!=='dcinside').map(s=><option key={s.id} value={s.id}>{s.name} 기본 규칙</option>)}</select></label><p>이름은 표시용이며 실제 수집 대상은 주소로 결정됩니다. 기본 규칙을 복사해도 검증 결과는 복사하지 않습니다. 새 사이트는 검사 통과 여부와 관계없이 OFF로 저장할 수 있습니다. 주소로 자동 선택 시 알려진 사이트는 기본 규칙을 사용하고, 나머지는 일반 규칙으로 저장합니다. 기타 사이트는 저장 후 ‘수집 조건 변경’에서 추출 규칙을 맞춰야 할 수 있습니다.</p>{error&&<p role="alert" className="ops-add-error">저장하지 못했습니다: {error}</p>}<div className="ops-actions"><button className="primary" disabled={busy} type="submit">저장하고 실제 검사</button><button disabled={busy} type="button" onClick={()=>void save(false)}>저장만 하기</button><button disabled={busy} type="button" onClick={()=>setOpen(false)}>취소</button></div></form>}</>}
const failureGuides=[
 {pattern:/REQUIRED_FIELDS_MISSING|REQUIRED_FIELD_DISABLED/,title:'필수 데이터 부족 또는 설정 충돌',text:'위의 부족한 필드와 사용 안 함 단계를 확인하세요. 본문·이미지가 필요하면 추출 규칙을 수정하고, 링크만 필요하면 링크 모드와 필수 필드를 조정한 뒤 재검사하세요.'},
 {pattern:/MEDIA_HOST_NOT_ALLOWED/,title:'설정 수정 가능 · 미디어 서버 누락',text:'사진·영상 서버가 허용 목록에 없습니다. 실제 서버 주소를 확인해 추가한 뒤 다시 검사하세요.'},
 {pattern:/HTTP 404/,title:'주소 확인 필요 · 페이지 없음',text:'목록 주소, 갤러리 주소 또는 삭제된 글·파일인지 확인하세요. 주소 오류라면 수정할 수 있습니다.'},
 {pattern:/EMPTY_RESPONSE/,title:'원본 서버 빈 응답 · 추출 규칙 오류와 구분',text:'서버가 성공 응답을 보냈지만 HTML 내용이 비어 있습니다. 일시 응답 문제나 접근 정책일 수 있으므로 선택자를 바꾸기보다 원본 주소와 서버 상태를 확인하세요.'},
 {pattern:/UNSAFE_REDIRECT/,title:'원본 서버 이동 문제 · HTTPS에서 HTTP로 이동',text:'입력한 주소는 HTTPS이지만 원본 서버가 보안 연결이 아닌 HTTP로 보내고 있습니다. 정상 HTTPS 주소가 필요하며 보안 검사를 해제하지 않습니다.'},
 {pattern:/SELECTOR_MISMATCH/,title:'추출 규칙 확인 필요 · 목록·본문 인식 실패',text:'페이지 구조 변경이나 잘못된 주소일 수 있습니다. 차단 안내 페이지가 반환됐는지도 확인해야 합니다.'},
 {pattern:/PARSING_UNVERIFIED/,title:'추출 확인 필요 · 댓글·미디어 미확인',text:'표본 글에 댓글·미디어가 없거나 추출 규칙이 맞지 않을 수 있습니다. 이 오류만으로 수집 불가라고 판단하지 마세요.'},
 {pattern:/robots\.txt/,title:'현재 자동수집 제한 · robots.txt 금지',text:'요청 경로의 자동 접근이 금지돼 있습니다. 허용된 제공 경로나 운영자 허가가 없으면 현재 방식으로 수집할 수 없습니다. 사용하지 않을 경우 삭제해도 됩니다.'},
 {pattern:/DC public comment endpoint denied access/,title:'현재 자동수집 제한 · 디시 댓글 접근 거부',text:'현재 댓글 요청 방식이 거부됐습니다. 댓글이 필요 없다면 수집 조건에서 가져올 댓글 수를 0으로 저장한 뒤 다시 검사하세요. 본문·미디어가 통과하면 댓글 없이 사용할 수 있습니다.'},
 {pattern:/HTTP 403/,title:'접근 거부 · 원본 사이트 확인 필요',text:'권한 또는 자동 접근 제한일 수 있습니다. 현재 요청은 거부됐지만 영구 불가라는 뜻은 아닙니다. 정상 접근 방법이 확인되기 전에는 OFF로 두세요.'},
 {pattern:/HTTP 406/,title:'요청 거부 · 원인 확인 필요',text:'요청 형식 문제나 접근 제한일 수 있습니다. 주소와 서버 응답을 확인해야 하며 이 코드만으로 영구 차단을 판단할 수 없습니다.'},
 {pattern:/HTTP (429|430)/,title:'접근 제한 · 요청 빈도 확인 필요',text:'요청량 제한 또는 접근 정책에 걸렸을 수 있습니다. 반복 검사하지 말고 서버 응답을 확인한 뒤 간격을 조정하세요.'},
 {pattern:/UNSAFE_URL/,title:'주소 확인 필요 · URL 보안 검사 거절',text:'주소 형식, 프로토콜 또는 이동되는 서버 주소를 확인하세요. 잘못된 주소는 수정하되 보안 검사를 해제하지는 않습니다.'}
];
export function SourceVerification({row}:{row:Record<string,unknown>}){
 let counts:Record<string,number>={};try{counts=JSON.parse(String(row.validation_counts||'{}')).validation||{}}catch{}
 const reason=String(row.validation_error||''),status=String(row.validation_status||'미검증'),pending=['검사 대기','검사 중'].includes(status);
 let source:Record<string,unknown>={};try{source=JSON.parse(String(row.config||'{}'))}catch{}
 const guides=failureGuides.filter(g=>g.pattern.test(reason));
 return <div className="source-verification" aria-live="polite">
 <ModeStatus row={row}/><strong className={status==='통과'?'ops-validation-passed':undefined}>{status}</strong>
 {status==='검사 대기'&&<span> · worker가 순서대로 실행합니다.</span>}{status==='검사 중'&&<span> · 수집 방식 판별 → 필요한 데이터 확인 중</span>}
 {source.commentLimit===0&&<p>댓글 수집 OFF · 댓글 요청·검증 생략</p>}{source.images===false&&source.videos===false&&<p>사진·동영상 수집 OFF · 미디어 요청·검증 생략</p>}
 {Object.keys(counts).length>0&&<p>최근 검사: 목록 {counts.listCount||0}개 · 상세 {counts.details||0}건 · 댓글 {counts.comments||0}개 · 미디어 {counts.media||0}개</p>}
 {status!=='통과'&&<div className="ops-failure-guidance">
 {pending&&<p>현재 검사 결과는 아직 나오지 않았습니다. 아래 내용이 있으면 이전 검사 기록입니다.</p>}
 {guides.map(g=><div key={g.title}><strong>{g.title}</strong><p>{g.text}</p></div>)}
 {!guides.length&&!pending&&<p>{status==='미검증'?'아직 검사하지 않았습니다. 수집 테스트를 먼저 실행하세요.':'실패 원인을 확정할 수 없습니다. 주소와 아래 오류 내용을 확인한 뒤 다시 검사하세요.'}</p>}
 {reason&&reason!=='미검증 소스'&&<details><summary>{pending?'이전 오류 원문':'오류 원문 보기'}</summary><pre>{reason}</pre></details>}
 </div>}
 </div>
}

