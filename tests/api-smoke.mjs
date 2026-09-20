import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const base=process.env.QA_BASE||'http://127.0.0.1:8787';
if(new URL(base).hostname!=='127.0.0.1')throw Error('Isolated local server only');
const run=Date.now(), a='qa-admin-'+run,b='qa-member-'+run,c='qa-race-'+run;
async function req(path,user,body,status=200,extra={}){const headers={connection:"close",origin:base,...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user===a?'seedy@sites.test':user+'@test.invalid'}:{}),...extra};if(body!==undefined&&!Buffer.isBuffer(body)){headers['content-type']='application/json';body=JSON.stringify(body)}const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers,body});const data=r.headers.get('content-type')?.includes('application/json')?await r.json():Buffer.from(await r.arrayBuffer());assert.equal(r.status,status,JSON.stringify({path,data}));return {data,r}}
const get=async(path,user)=>(await req(path,user)).data;
const post=async(path,user,body,status=200)=>(await req(path,user,body,status)).data;


await req('/api/admin',b,undefined,403);
await req('/api/downloads',null,{},401);
let settings=await get('/api/settings');
assert.equal(settings.settings.autoplay,false);
assert.equal(settings.settings.imageCost,10);
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6ioAAAAASUVORK5CYII=','base64');
const video=readFileSync('.sites-runtime/qa.mp4');
const im=(await req('/api/media',a,image,201,{'content-type':'image/png'})).data;
const vi=(await req('/api/media',a,video,201,{'content-type':'video/mp4'})).data;
assert.equal(vi.kind,'video');
await req('/api/media',a,Buffer.alloc(100,65),415,{'content-type':'video/mp4'});
const p=await post('/api/posts',a,{title:'통합 검증 '+run,nickname:'테스터',category:'영상',blocks:[{type:'text',text:'내용 https://youtu.be/dQw4w9WgXcQ https://example.com'},{type:'image',id:im.id},{type:'video',id:vi.id}]},201);
const range=await req('/api/media/'+vi.id,null,undefined,206,{range:'bytes=10-29'});
assert.deepEqual(range.data,video.subarray(10,30));
assert.equal(range.r.headers.get('content-range'),'bytes 10-29/'+video.length);
await req('/api/media/'+vi.id,null,undefined,416,{range:'bytes=999999-'});
const buy=(who,mediaId,cost,status=200)=>post('/api/downloads',who,{postId:p.id,mediaId,expectedCost:cost},status);

await buy(b,im.id,10,403);
assert.equal((await post('/api/me',b,{nickname:'회원'+run})).member.points,0);
await buy(b,im.id,10,402);
const grantId=randomUUID();
const grant=(owner,amount,requestId=randomUUID())=>post('/api/admin',a,{action:'grant',owner,amount,reason:'검증',requestId});
await grant(b,50,grantId);await grant(b,50,grantId);
assert.equal((await get('/api/me',b)).member.points,50);
const purchases=await Promise.all(Array.from({length:5},()=>buy(b,im.id,10)));
assert.equal(purchases.reduce((n,v)=>n+v.charged,0),10);
assert.equal(new Set(purchases.map(v=>v.url)).size,1);
assert.equal((await get('/api/me',b)).member.points,40);
const file=await req(purchases[0].url,b);assert.deepEqual(file.data,image);
await req(purchases[0].url,a,undefined,403);
await req(purchases[0].url,null,undefined,401);
await buy(b,undefined,5);const vbuy=await buy(b,vi.id,30);
assert.deepEqual((await req(vbuy.url,b)).data,video);
assert.equal((await get('/api/me',b)).member.points,5);
await post('/api/me',b,{nickname:'다른이름'});
assert.equal((await get('/api/me',b)).member.points,5);
await post('/api/me',c,{nickname:'경합'+run});await grant(c,10);
const race=await Promise.all([fetch(base+'/api/downloads',{method:'POST',headers:{connection:'close',origin:base,'content-type':'application/json','oai-authenticated-user-id':c,'oai-authenticated-user-email':c+'@test.invalid'},body:JSON.stringify({postId:p.id,mediaId:im.id,expectedCost:10})}),fetch(base+'/api/downloads',{method:'POST',headers:{connection:'close',origin:base,'content-type':'application/json','oai-authenticated-user-id':c,'oai-authenticated-user-email':c+'@test.invalid'},body:JSON.stringify({postId:p.id,expectedCost:5})})]);
assert.deepEqual(race.map(v=>v.status).sort(),[200,402]);assert.ok((await get('/api/me',c)).member.points>=0);
await post('/api/posts/'+p.id+'/actions',b,{action:'like',liked:true});
await post('/api/posts/'+p.id+'/actions',b,{action:'comment',nickname:'회원',body:'댓글'});
await post('/api/posts/'+p.id+'/view',b,{});await post('/api/posts/'+p.id+'/view',b,{});
let adm=await get('/api/admin',a);const defaults={...adm.settings};
async function config(patch){adm=await post('/api/admin',a,{action:'settings',revision:adm.revision,settings:{...adm.settings,...patch}})}
await config({popularLikes:1,popularComments:1,popularViews:1,popularMode:'all'});
assert.ok((await get('/api/posts?sort=popular')).posts.some(v=>v.id===p.id));
await config({popularViews:2});assert.ok(!(await get('/api/posts?sort=popular')).posts.some(v=>v.id===p.id));
await config({popularMode:'any'});assert.ok((await get('/api/posts?sort=popular')).posts.some(v=>v.id===p.id));
await post('/api/admin',a,{action:'settings',revision:adm.revision-1,settings:adm.settings},409);
await post('/api/admin',b,{action:'settings',revision:adm.revision,settings:adm.settings},403);
await config({imageCost:11});await buy(c,im.id,10,(await get('/api/me',c)).member.points===0?200:409);
await config({popularLikes:0,popularComments:0,popularViews:0});assert.equal((await get('/api/posts?sort=popular')).posts.length,0);
await config(defaults);
const detail=await get('/api/posts/'+p.id);
assert.ok(JSON.parse(detail.post.body).some(v=>v.type==='youtube'));
console.log('PASS: upload, MP4 range bytes, membership, pricing, download authorization, atomic/idempotent charges, admin permissions/revisions, popular AND/OR and view deduplication');





