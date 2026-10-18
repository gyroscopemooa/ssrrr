import test from 'node:test';
import assert from 'node:assert/strict';
import {isPlainUrlPaste} from '../lib/paste-url.ts';
test('single copied video addresses take priority over clipboard HTML',()=>{
 assert.equal(isPlainUrlPaste(' https://www.tiktok.com/@creator/video/1234567890123456789?x=1 '),true);
 assert.equal(isPlainUrlPaste('https://vt.tiktok.com/ABC/'),true);
 assert.equal(isPlainUrlPaste('some text https://www.tiktok.com/'),false);
 assert.equal(isPlainUrlPaste('https://a.test/\nhttps://b.test/'),false);
 assert.equal(isPlainUrlPaste('javascript:alert(1)'),false);
});
