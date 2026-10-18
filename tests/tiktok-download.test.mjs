import test from 'node:test';
import assert from 'node:assert/strict';
import {tiktokDownloadOptions} from '../worker/tiktok-download.mjs';
test('TikTok acquisition only requests download format, never playback fallback',()=>{
 const args=tiktokDownloadOptions('https://www.tiktok.com/@creator/video/123','out.mp4');
 assert.equal(args[args.indexOf('-f')+1],'download');
 assert.equal(args[args.indexOf('--retries')+1],'0');
 assert(args.includes('--no-config'));assert(!args.some(a=>/cookies|proxy|impersonate/.test(a)));
});
test('TikTok acquisition rejects credentials, other platforms and non-HTTPS',()=>{
 for(const url of ['http://www.tiktok.com/x','https://youtube.com/shorts/x','https://tiktok.com.evil.test/x','https://user:pass@tiktok.com/x','https://tiktok.com:444/x'])assert.throws(()=>tiktokDownloadOptions(url,'unused'),/POLICY_BLOCKED/);
});
