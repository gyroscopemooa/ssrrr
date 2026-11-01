import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile);

// Technical acquisition only: caller must establish rights and platform approval.
// Prefer TikTok's downloadable (watermarked) asset. Some posts do not expose that
// format id, so fall back only to a directly downloadable HTTPS file.
export const TIKTOK_FORMAT='download/best[ext=mp4][protocol=https]/best[protocol=https]';
export function tiktokDownloadOptions(value,file){
 const url=new URL(value),host=url.hostname.toLowerCase().replace(/^www\./,'');
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['tiktok.com','m.tiktok.com','vm.tiktok.com','vt.tiktok.com'].includes(host))throw Error('EXTERNAL_POLICY_BLOCKED: 지원하지 않는 외부 영상 주소입니다.');
 return ['--no-config','--no-playlist','--no-part','--restrict-filenames','--socket-timeout','20','--retries','2','--fragment-retries','2','--max-filesize','100M','--match-filter','!is_live','-f',TIKTOK_FORMAT,'-o',file,url.href];
}
export async function downloadExternal(url,file){
 const options=tiktokDownloadOptions(url,file),moduleMode=process.platform==='win32'&&!process.env.YT_DLP_PATH;
 const command=process.env.YT_DLP_PATH||(moduleMode?(process.env.PYTHON_PATH||'python'):path.resolve('bin/yt-dlp'));
 try{
  await exec(command,moduleMode?['-m','yt_dlp',...options]:options,{timeout:120000,maxBuffer:4000000,windowsHide:true});
 }catch(error){
  const detail=String(error?.stderr||error?.message||error);
  if(/Requested format is not available|Unable to download format/i.test(detail))throw Error('TIKTOK_FORMAT_UNAVAILABLE: TikTok에서 다운로드 가능한 영상 포맷을 찾지 못했습니다. yt-dlp를 최신 버전으로 업데이트한 뒤 다시 시도해 주세요.');
  if(/impersonat|Sign in|cookies/i.test(detail))throw Error('TIKTOK_ACCESS_REQUIRED: TikTok이 이 영상의 자동 접근을 제한했습니다. 공개 영상인지 확인하거나 원본 MP4를 등록해 주세요.');
  throw Error('TIKTOK_DOWNLOAD_FAILED: TikTok 영상을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.');
 }
 return file;
}
