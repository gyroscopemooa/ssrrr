import Community from './community';
import {getFeed} from '@/lib/feed';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {const p=await searchParams,one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v,q=one(p.q),scope=one(p.scope),board=one(p.board)||(q||scope==='site'?undefined:'유머');const initial=await getFeed({board,sort:one(p.sort),q,scope});return <Community initial={initial}/>;}

