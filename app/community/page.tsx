import type {Metadata} from 'next';
import Community from '../community';
import {getFeed} from '@/lib/feed';
import {SITE_URL} from '@/lib/site-config.mjs';
export const metadata:Metadata={title:'질문·이용팁',description:'스르륵에서 궁금한 점을 묻고 직접 확인한 해결 방법과 이용팁을 나눠요.',alternates:{canonical:SITE_URL+'/community'},openGraph:{title:'질문·이용팁 · 스르륵',description:'질문 하나와 따라 할 수 있는 해결 방법',url:SITE_URL+'/community',type:'website'}};
export default async function Page(){return <Community initial={await getFeed({board:'질문·이용팁'})}/>}
