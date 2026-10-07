import Link from 'next/link';
export default function LoginError(){return <main style={{maxWidth:480,margin:'15vh auto',padding:24}}><h1>로그인을 완료하지 못했어요</h1><p>로그인이 취소되었거나 시간이 만료되었습니다. 다시 시도해 주세요.</p><a href="/auth/google">구글로 다시 로그인</a><p><Link href="/">스르륵으로 돌아가기</Link></p></main>}
