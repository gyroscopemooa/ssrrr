import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile);

// Technical acquisition only: caller must establish rights and platform approval.
// Retain watermark and never fall back to playback-only formats.
export function tiktokDownloadOptions(value,file){
 const url=new URL(value),host=url.hostname.toLowerCase().replace(/^www\./,'');
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['tiktok.com','m.tiktok.com','vm.tiktok.com','vt.tiktok.com'].includes(host))throw Error('EXTERNAL_POLICY_BLOCKED: 지원하지 않는 외부 영상 주소입니다.');
 return ['--no-config','--no-playlist','--no-part','--restrict-filenames','--socket-timeout','20','--retries','0','--max-filesize','100M','--match-filter','duration <= 180 & !is_live','-f','download','-o',file,url.href];
}
export async function downloadExternal(url,file){
 const options=tiktokDownloadOptions(url,file),moduleMode=process.platform==='win32'&&!process.env.YT_DLP_PATH;
 const command=process.env.YT_DLP_PATH||(moduleMode?(process.env.PYTHON_PATH||'python'):path.resolve('bin/yt-dlp'));
 await exec(command,moduleMode?['-m','yt_dlp',...options]:options,{timeout:120000,maxBuffer:4000000,windowsHide:true});
 return file;
}
