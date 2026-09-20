import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'미정 — 유머, 짤, 소소한 이야기',description:'웃긴 건 같이 보자. 유머와 일상의 이야기를 나누는 커뮤니티 미정.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
