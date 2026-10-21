import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage();
 await page.route('**/*',route=>route.abort());
 await page.setContent('<div role="textbox" contenteditable="true" id="editor"></div>');
 await page.addScriptTag({path:new URL('../node_modules/dompurify/dist/purify.min.js',import.meta.url).pathname.replace(/^\/(.:)/,'$1')});
 const code=['models','paste-url','editor'].map(name=>ts.transpileModule(readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/^import .*;\s*$/gm,'').replace(/\bexport /g,'')).join('\n');
 await page.addScriptTag({content:code});
 await page.evaluate(()=>{window.changes=0;const root=document.querySelector('#editor');root.addEventListener('input',()=>window.changes++);renderBlocks(root,[{type:'link',url:'https://www.tiktok.com/'}]);});
 assert.equal(await page.locator('#editor > p').count(),2);
 await page.locator('#editor > p').first().click();
 await page.keyboard.type('Before video');
 await page.locator('#editor > p').last().click();
 await page.keyboard.type('After video');
 await page.getByRole('button',{name:'첨부 빼기'}).click();
 const result=await page.evaluate(()=>({blocks:readBlocks(document.querySelector('#editor')),changes:window.changes}));
 assert.equal(result.blocks.some(b=>b.type==='link'),false);
 assert.match(result.blocks.map(b=>b.text||'').join(' '),/Before video/);
 assert.match(result.blocks.map(b=>b.text||'').join(' '),/After video/);
 assert(result.changes>0);
 await page.evaluate(()=>{const root=document.querySelector('#editor');renderBlocks(root,[]);root.focus();insertFragment(root,parsePaste('', 'https://www.tiktok.com/').fragment);});
 await page.keyboard.type('New caption');
 assert.match(await page.evaluate(()=>JSON.stringify(readBlocks(document.querySelector('#editor')))),/New caption/);
 const tables=await page.evaluate(()=>{
  const html=parsePaste('<table onclick="alert(1)"><tr><th>제품</th><th>가격</th></tr><tr><td><img src=x onerror=alert(1)>A</td><td>10</td></tr></table><script>alert(1)</script>','제품 가격').fragment;
  const root=document.querySelector('#editor');renderBlocks(root,[]);insertFragment(root,html);
  return {html:root.innerHTML,blocks:readBlocks(root),markdown:parseTableSource('| 이름 | 점수 |\n| --- | --- |\n| 철수 | 10 |'),tsv:parseTableSource('이름\t점수\n영희\t20')};
 });
 assert.equal(tables.blocks[0].type,'table');assert.deepEqual(tables.blocks[0].rows,[['제품','가격'],['A','10']]);
 assert.doesNotMatch(tables.html,/script|onerror|onclick/i);assert.equal(tables.markdown.header,true);assert.equal(tables.tsv.rows[1][0],'영희');
 console.log('PASS: editor embeds, HTML/Markdown/TSV tables, sanitizer and XSS stripping');
}finally{await browser.close()}
