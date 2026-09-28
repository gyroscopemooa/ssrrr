import {wrap,json} from '@/lib/server';
import {workerAuth} from '@/lib/automation/server';
import {ingestDirect} from '@/lib/automation/mail';

export const POST=wrap(async req=>{
  await workerAuth(req);
  const result=await ingestDirect(await json(req));
  return Response.json(result,{status:'duplicate' in result?200:201,headers:{'Cache-Control':'no-store'}});
});
