import {env} from 'cloudflare:workers';
import {wrap,json} from '@/lib/server';
import {workerAuth} from '@/lib/automation/server';
import {ingestDirect} from '@/lib/automation/mail';

export const POST=wrap(async req=>{
  await economyIngestAuth(req);
  const result=await ingestDirect(await json(req));
  return Response.json(result,{status:'duplicate' in result?200:201,headers:{'Cache-Control':'no-store'}});
});

async function economyIngestAuth(req:Request){
  const token=env.MCP_INGEST_TOKEN;
  if(token&&token.length>=32){
    const [actual,expected]=await Promise.all([
      crypto.subtle.digest('SHA-256',new TextEncoder().encode(req.headers.get('authorization')||'')),
      crypto.subtle.digest('SHA-256',new TextEncoder().encode('Bearer '+token)),
    ]);
    let diff=0;const a=new Uint8Array(actual),b=new Uint8Array(expected);
    for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
    if(diff===0)return;
  }
  await workerAuth(req);
}
