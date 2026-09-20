import {wrap} from '@/lib/server';import {settings} from '@/lib/settings';
export const GET=wrap(async()=>Response.json(await settings(),{headers:{'Cache-Control':'no-store'}}));

