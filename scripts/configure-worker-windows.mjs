import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
// Receive credentials on stdin, never command-line arguments or a plaintext file.
if(process.stdin.isTTY){process.stdin.setRawMode(true);console.log('Secure credential input ready (terminal echo disabled).')}
const reader=createInterface({input:process.stdin,terminal:false});const [line]=await once(reader,'line');reader.close();
try{const config=JSON.parse(line);if(new URL(config.WORKER_SITE_URL).protocol!=='https:'||!config.WORKER_TOKEN||config.WORKER_TOKEN.length<32)throw Error('Invalid worker settings');
const headers={Authorization:'Bearer '+config.WORKER_TOKEN,'OAI-Sites-Authorization':'Bearer '+config.SITES_DISPATCHER_TOKEN,'Content-Type':'application/json'};
const probe=await fetch(config.WORKER_SITE_URL+'/api/worker',{method:'POST',headers,body:JSON.stringify({action:'probe'}),redirect:'error'});if(probe.status!==400)throw Error('Worker authentication probe HTTP '+probe.status);
const response=await fetch(config.WORKER_SITE_URL+'/api/ops',{headers,redirect:'error'});if(!response.ok&&response.status!==403)throw Error('Site status HTTP '+response.status);const data=response.ok?await response.json():null;
const encrypted=execFileSync('pwsh.exe',['-NoProfile','-NonInteractive','-Command','$payload=[Console]::In.ReadToEnd(); ConvertTo-SecureString -String $payload -AsPlainText -Force | ConvertFrom-SecureString'],{input:JSON.stringify(config),encoding:'utf8',windowsHide:true});
const directory=path.resolve('.worker-runtime');mkdirSync(directory,{recursive:true});writeFileSync(path.join(directory,'credentials.dpapi'),encrypted.trim());
console.log(JSON.stringify({authenticated:true,credentials:'Windows DPAPI encrypted',paused:data?.config.paused,adminStatus:response.status,sources:data?.sources.map(s=>({id:s.id,name:s.name,enabled:s.enabled,tested:!!s.tested_at})),workerCount:data?.workers.length}));
}catch(e){console.error('Configuration failed: '+e.message);process.exitCode=1}

