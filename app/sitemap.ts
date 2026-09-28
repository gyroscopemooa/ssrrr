import type {MetadataRoute} from 'next';
import {db} from '@/lib/server';
import {SITE_URL} from '@/lib/site-config.mjs';

export const revalidate=3600;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const entries:MetadataRoute.Sitemap=[{url:SITE_URL,lastModified:new Date(),changeFrequency:'hourly',priority:1},{url:SITE_URL+'/about',changeFrequency:'monthly',priority:.4}];try{const rows=await db().prepare('SELECT id,created_at FROM posts WHERE hidden=0 ORDER BY created_at DESC LIMIT 5000').all<{id:string;created_at:number}>();entries.push(...rows.results.map(post=>({url:SITE_URL+'/post/'+post.id,lastModified:new Date(post.created_at),changeFrequency:'weekly' as const,priority:.7})))}catch{}return entries}
