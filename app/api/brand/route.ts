import {ops} from '@/lib/automation/server';import {wrap} from '@/lib/server';
export const GET=wrap(async()=>{const {config}=await ops();return Response.json({name:config.siteName,url:config.siteUrl},{headers:{'Cache-Control':'no-store'}})});
