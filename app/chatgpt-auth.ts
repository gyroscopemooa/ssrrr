import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {digest,readCookie,sessionCookie,safeReturn} from '@/lib/auth/core.mjs';
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
// Compatibility export for existing callers; identity is now an opaque Google session.
export async function getChatGPTUser():Promise<ChatGPTUser|null>{
 const token=readCookie((await headers()).get('cookie'),sessionCookie);
 if(!/^[A-Za-z0-9_-]{43}$/.test(token)||!env.DB)return null;
 const user=await env.DB.prepare('SELECT u.owner,u.email,u.display_name FROM auth_sessions s JOIN auth_users u ON u.owner=s.owner WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),Date.now()).first<{owner:string;email:string;display_name:string}>();
 return user?{userId:user.owner,email:user.email,displayName:user.display_name,fullName:user.display_name}:null;
}
export async function requireChatGPTUser(returnTo:string){const u=await getChatGPTUser();if(u)return u;redirect(chatGPTSignInPath(returnTo))}
export function chatGPTSignInPath(returnTo:string){return '/auth/google?return_to='+encodeURIComponent(safeReturn(returnTo))}
export function chatGPTSignOutPath(){return '/auth/logout'}
