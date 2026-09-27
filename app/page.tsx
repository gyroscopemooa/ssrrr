import Community from './community';
import {getFeed} from '@/lib/feed';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {const p=await searchParams,one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;const initial=await getFeed({board:one(p.board),sort:one(p.sort),q:one(p.q),scope:one(p.scope)});return <Community initial={initial}/>;}

