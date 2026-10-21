import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

function readSecret(prompt){
  return new Promise((resolve,reject)=>{
    if(!process.stdin.isTTY){reject(new Error('Run this script in an interactive PowerShell window'));return}
    process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');let value='';
    const finish=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value)};
    const onData=(chunk)=>{for(const char of chunk){if(char==='\u0003'){process.stdout.write('\n');process.exit(130)}if(char==='\r'||char==='\n'){finish();return}if(char==='\u0008'||char==='\u007f'){value=value.slice(0,-1);continue}value+=char}};
    process.stdin.on('data',onData);
  });
}

try{
const workerToken=(await readSecret('New WORKER_TOKEN (32+ characters): ')).trim();
const dispatcherToken=(await readSecret('SITES_DISPATCHER_TOKEN (optional, Enter to skip): ')).trim();
const config={WORKER_SITE_URL:'https://ssrrr.net',WORKER_TOKEN:workerToken,SITES_DISPATCHER_TOKEN:dispatcherToken};
if(!config.WORKER_TOKEN||config.WORKER_TOKEN.length<32)throw Error('WORKER_TOKEN must be at least 32 characters');
const headers={Authorization:'Bearer '+config.WORKER_TOKEN,'OAI-Sites-Authorization':'Bearer '+config.SITES_DISPATCHER_TOKEN,'Content-Type':'application/json'};
const probe=await fetch(config.WORKER_SITE_URL+'/api/worker',{method:'POST',headers,body:JSON.stringify({action:'probe'}),redirect:'error'});if(probe.status!==400)throw Error('Worker authentication probe HTTP '+probe.status+' (deployed WORKER_TOKEN must match)');
const response=await fetch(config.WORKER_SITE_URL+'/api/ops',{headers,redirect:'error'});if(!response.ok&&response.status!==403)throw Error('Site status HTTP '+response.status);const data=response.ok?await response.json():null;
const encrypted=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','$payload=[Console]::In.ReadToEnd(); ConvertTo-SecureString -String $payload -AsPlainText -Force | ConvertFrom-SecureString'],{input:JSON.stringify(config),encoding:'utf8',windowsHide:true});
const directory=path.resolve('.worker-runtime');mkdirSync(directory,{recursive:true});writeFileSync(path.join(directory,'credentials.dpapi'),encrypted.trim());
console.log(JSON.stringify({authenticated:true,credentials:'Windows DPAPI encrypted',paused:data?.config.paused,adminStatus:response.status,sources:data?.sources.map(s=>({id:s.id,name:s.name,enabled:s.enabled,tested:!!s.tested_at})),workerCount:data?.workers.length}));
}catch(e){if(process.stdin.isTTY&&process.stdin.isRaw)process.stdin.setRawMode(false);console.error('Configuration failed: '+e.message);process.exitCode=1}

