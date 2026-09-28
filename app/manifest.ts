import type {MetadataRoute} from 'next';
import {SITE_DESCRIPTION,SITE_NAME} from '@/lib/site-config.mjs';

export default function manifest():MetadataRoute.Manifest{return {name:SITE_NAME,short_name:'SSRRR',description:SITE_DESCRIPTION,start_url:'/',display:'standalone',background_color:'#f7f7fb',theme_color:'#645ee2',lang:'ko',icons:[{src:'/favicon.svg',sizes:'any',type:'image/svg+xml'}]}}
