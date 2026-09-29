'use client';
import {useEffect,useState} from 'react';
import {Shell,api} from '../community';
import {Wallet,Download,UserRoundPen} from 'lucide-react';
import {Table,TableHeader,TableRow,TableHead,TableBody,TableCell} from '@/components/ui/table';
import type {Settings} from '@/lib/models';
type Data={member:{nickname:string;points:number}|null;settings:Settings;ledger:{id:string;delta:number;reason:string;created_at:number}[]};
export default function Account(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[nickname,setNickname]=useState(''),[busy,setBusy]=useState(false),[signed,setSigned]=useState<boolean|null>(null);
 const load=()=>api<Data>('/api/account').then(d=>{setData(d);if(d.member)setNickname(d.member.nickname)});
 useEffect(()=>{api<{signedIn:boolean}>('/api/me').then(d=>{setSigned(d.signedIn);if(d.signedIn)return load()}).catch(e=>setError(e.message))},[]);
 async function rename(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await api('/api/me',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname})});await load()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <Shell><div className="page-head"><div><h1>마이페이지</h1><p className="subtext">닉네임과 포인트 내역을 관리할 수 있어요.</p></div><Wallet/></div>{signed===false?<section className="panel"><h2>로그인해 주세요</h2><p className="subtext">로그인하면 임시 닉네임이 자동으로 만들어져 바로 활동할 수 있습니다.</p><a className="primary" href="/signin-with-chatgpt?return_to=/account" target="_top">ChatGPT로 로그인</a></section>:data?.member?<><section className="wallet-card"><span>{data.member.nickname}님의 보유 포인트</span><strong>{data.member.points.toLocaleString()} <small>P</small></strong><p>포인트는 관리자 지급 또는 가입 지급으로 적립됩니다.</p></section><form className="panel" onSubmit={rename}><h2><UserRoundPen style={{display:'inline'}}/> 닉네임 변경</h2><p className="subtext">가입할 때 발급된 임시 닉네임을 원하는 닉네임으로 바꿀 수 있습니다.</p><div className="field"><label htmlFor="nickname">닉네임</label><input id="nickname" className="field-input" minLength={1} maxLength={24} required value={nickname} onChange={e=>setNickname(e.target.value)}/></div><button className="primary" disabled={busy||nickname===data.member.nickname}>{busy?'변경 중…':'닉네임 변경'}</button></form><div className="price-grid"><span>사진 다운로드 <b>{data.settings.imageCost}P</b></span><span>영상 다운로드 <b>{data.settings.videoCost}P</b></span><span>글 TXT 다운로드 <b>{data.settings.textCost}P</b></span></div><section className="panel"><h2><Download style={{display:'inline'}}/> 최근 포인트 내역</h2><Table><TableHeader><TableRow><TableHead>내역</TableHead><TableHead>포인트</TableHead><TableHead>날짜</TableHead></TableRow></TableHeader><TableBody>{data.ledger.map(l=><TableRow key={l.id}><TableCell>{l.reason}</TableCell><TableCell>{l.delta>0?'+':''}{l.delta}P</TableCell><TableCell>{new Date(l.created_at).toLocaleDateString('ko-KR')}</TableCell></TableRow>)}</TableBody></Table></section></>:<p className="loading">불러오는 중…</p>}{error&&<p className="status error" role="alert">{error}</p>}</Shell>
}


