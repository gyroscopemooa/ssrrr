import {access, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

const runtime=path.resolve(process.env.WORKER_TEMP_DIR||'.worker-runtime');
const profile=path.resolve(process.env.CHATGPT_PROFILE_DIR||path.join(runtime,'chatgpt-profile'));
const marker=path.join(runtime,'chatgpt-login-required.json');

export function validateChatGptUrl(value){
 try{const url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='chatgpt.com')throw Error();return url.href}catch{throw Error('BLOCKED: CHATGPT_VIEW_URL_INVALID')}
}

export async function chatGptRelayStatus(){
 if(process.env.CHATGPT_RELAY_ENABLED!=='true')return 'disabled';
 try{await access(marker);return 'login_required'}catch{return 'ready'}
}

async function browser(headless){
 const {chromium}=await import('playwright-core');
 await mkdir(profile,{recursive:true});
 return chromium.launchPersistentContext(profile,{channel:process.env.CHATGPT_BROWSER_CHANNEL||'msedge',headless,viewport:{width:1440,height:1000},locale:'ko-KR'});
}

async function loginRequired(page){
 const url=new URL(page.url());
 if(/\/(?:auth\/)?(?:login|signin)(?:\/|$)/i.test(url.pathname))return true;
 if(await page.locator('input[type="password"]').count())return true;
 const buttons=page.getByRole('button',{name:/^(?:log in|sign in|로그인)$/i});
 return await buttons.count()>0&&await buttons.first().isVisible().catch(()=>false);
}

export async function markChatGptLoginRequired(sourceUrl=''){
 await mkdir(runtime,{recursive:true});
 let first=false;try{await access(marker)}catch{first=true}
 await writeFile(marker,JSON.stringify({status:'ChatGPT 재로그인 필요',detectedAt:new Date().toISOString(),sourceUrl},null,2),'utf8');
 if(first&&process.platform==='win32'){
  const child=spawn('msg.exe',['*','ChatGPT 재로그인 필요'],{detached:true,stdio:'ignore',windowsHide:true});child.on('error',()=>{});child.unref();
 }
}

export async function readTaskMessage(viewMessageUrl,{headless=true}={}){
 if(await chatGptRelayStatus()==='login_required')throw Error('BLOCKED: CHATGPT_LOGIN_REQUIRED: ChatGPT 재로그인 필요');
 const target=validateChatGptUrl(viewMessageUrl),context=await browser(headless);
 try{
  const page=context.pages()[0]||await context.newPage();
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2500);
  if(await loginRequired(page)){await markChatGptLoginRequired(target);throw Error('BLOCKED: CHATGPT_LOGIN_REQUIRED: ChatGPT 재로그인 필요')}
  const selectors=['[data-message-author-role="assistant"] .markdown','[data-message-author-role="assistant"]','article[data-testid^="conversation-turn-"] .markdown'];
  let body='';
  for(const selector of selectors){const rows=page.locator(selector);if(await rows.count()){body=(await rows.last().innerText({timeout:20000})).replace(/\r\n?/g,'\n').trim();if(body)break}}
  if(!body){if(await loginRequired(page)){await markChatGptLoginRequired(target);throw Error('BLOCKED: CHATGPT_LOGIN_REQUIRED: ChatGPT 재로그인 필요')}throw Error('CHATGPT_MESSAGE_NOT_FOUND')}
  if(body.length>100000)throw Error('CHATGPT_MESSAGE_TOO_LARGE');
  if(body.split('\n',1)[0].trim()!=='SSRRR_ECONOMY')throw Error('CHATGPT_MESSAGE_INVALID: 첫 줄이 SSRRR_ECONOMY가 아닙니다.');
  return body;
 }finally{await context.close()}
}

export async function openManualLogin({timeoutMs=900000}={}){
 const context=await browser(false);
 try{
  const page=context.pages()[0]||await context.newPage();
  await page.goto('https://chatgpt.com/',{waitUntil:'domcontentloaded',timeout:60000});
  const started=Date.now();
  while(Date.now()-started<timeoutMs){if(!await loginRequired(page)&&await page.locator('main').count()){await rm(marker,{force:true});return {ready:true,profile}}await page.waitForTimeout(1000)}
  throw Error('LOGIN_TIMEOUT');
 }finally{await context.close()}
}

export async function markerDetails(){try{return JSON.parse(await readFile(marker,'utf8'))}catch{return null}}
