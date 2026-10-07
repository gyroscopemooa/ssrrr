import {createRemoteJWKSet,jwtVerify} from 'jose';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export const sessionCookie='__Host-ssrrr-session';
export const stateCookie='__Host-ssrrr-oauth';
export function safeReturn(value){if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return '/';try{const u=new URL(value,'https://ssrrr.net');if(u.origin!=='https://ssrrr.net'||u.pathname.startsWith('/auth/'))return '/';return u.pathname+u.search+u.hash}catch{return '/'}}
export function randomToken(){const a=crypto.getRandomValues(new Uint8Array(32));return Buffer.from(a).toString('base64url')}
export async function digest(value){return Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('base64url')}
export function cookie(name,value,age){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`}
export function readCookie(header,name){return (header||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||''}
export function checkedIdentity(payload,nonce){if(payload.nonce!==nonce||payload.email_verified!==true||typeof payload.email!=='string'||!payload.email.includes('@')||typeof payload.sub!=='string'||!payload.sub||payload.sub.length>255)throw Error('Invalid Google identity');return {subject:payload.sub,email:payload.email.toLowerCase(),name:typeof payload.name==='string'?payload.name.slice(0,200):payload.email}}
export async function verifyGoogleToken(idToken,clientId,nonce,keySet=googleKeys){const {payload}=await jwtVerify(idToken,keySet,{algorithms:['RS256'],issuer:['https://accounts.google.com','accounts.google.com'],audience:clientId,clockTolerance:5,maxTokenAge:'10 minutes'});if(payload.azp&&payload.azp!==clientId)throw Error('Invalid authorized party');return checkedIdentity(payload,nonce)}
