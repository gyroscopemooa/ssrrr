import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/site-config.mjs';

export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:'*',allow:'/',disallow:['/account','/admin','/api','/write']}],sitemap:SITE_URL+'/sitemap.xml',host:SITE_URL}}
