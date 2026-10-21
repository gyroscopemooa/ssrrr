import DOMPurify from 'dompurify';
import {isPlainUrlPaste} from './paste-url';
import {safeTable,splitLinks,tiktokId,type Block} from './models';
export type {Block} from './models';

function tableBlock(element:HTMLTableElement):Extract<Block,{type:'table'}>|null {
 const rows=Array.from(element.rows).map(row=>Array.from(row.cells).map(cell=>(cell.innerText||cell.textContent||'').trim()));
 return safeTable({type:'table',rows,header:!!element.querySelector('th')});
}

export function readBlocks(root:HTMLElement):Block[]{
 const out:Block[]=[];let text='';
 const flush=()=>{if(text.trim())out.push(...splitLinks(text.replace(/\n{3,}/g,'\n\n')));text=''};
 const walk=(n:Node)=>{
  if(n.nodeType===Node.TEXT_NODE){text+=n.textContent||'';return}
  if(!(n instanceof HTMLElement)||n.dataset.status)return;
  if(n.dataset.embed==='table'){flush();const table=n.querySelector('table'),block=table&&tableBlock(table);if(block)out.push(block);return}
  if(n.dataset.embed==='youtube'){flush();out.push({type:'youtube',videoId:n.dataset.videoId!});return}
  if(n.dataset.embed==='link'){flush();out.push({type:'link',url:n.dataset.url!});return}
  if(n.tagName==='IMG'||n.tagName==='VIDEO'){flush();if(n.dataset.mediaId)out.push({type:n.tagName==='VIDEO'?'video':'image',id:n.dataset.mediaId});return}
  if(n.tagName==='BR'){text+='\n';return}
  const block=/^(DIV|P|LI|H[1-6]|BLOCKQUOTE|TR)$/.test(n.tagName);if(block&&text&&!text.endsWith('\n'))text+='\n';n.childNodes.forEach(walk);if(block&&!text.endsWith('\n'))text+='\n';
 };
 root.childNodes.forEach(walk);flush();return out;
}

export function mediaNode(id:string,kind:'image'|'video'){
 if(kind==='video'){const v=document.createElement('video');v.src='/api/media/'+id;v.dataset.mediaId=id;v.controls=true;v.preload='metadata';v.playsInline=true;v.setAttribute('controlsList','nodownload');return v}
 const img=document.createElement('img');img.src='/api/media/'+id;img.dataset.mediaId=id;img.alt='첨부 이미지';return img;
}

function tableNode(initial:Extract<Block,{type:'table'}>):HTMLElement{
 const block={type:'table' as const,header:initial.header,rows:initial.rows.map(row=>[...row])};
 const box=document.createElement('div');box.contentEditable='false';box.className='editor-table-block';box.dataset.embed='table';
 const scroller=document.createElement('div');scroller.className='content-table-scroll';const table=document.createElement('table');table.className='content-table';
 const draw=()=>{table.replaceChildren();block.rows.forEach((row,rowIndex)=>{const tr=table.insertRow();row.forEach(value=>{const cell=block.header&&rowIndex===0?document.createElement('th'):document.createElement('td');cell.contentEditable='true';cell.textContent=value;cell.addEventListener('input',()=>box.dispatchEvent(new Event('input',{bubbles:true})));tr.appendChild(cell)})})};
 const sync=()=>{const next=tableBlock(table);if(next){block.rows=next.rows;block.header=next.header}};
 const action=(label:string,fn:()=>void)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.onmousedown=e=>e.preventDefault();button.onclick=()=>{sync();fn();draw();box.dispatchEvent(new Event('input',{bubbles:true}))};return button};
 const tools=document.createElement('div');tools.className='editor-table-tools';
 for(const button of [action('행 +',()=>block.rows.push(Array(block.rows[0].length).fill(''))),action('행 −',()=>{if(block.rows.length>1)block.rows.pop()}),action('열 +',()=>block.rows.forEach(row=>row.push(''))),action('열 −',()=>{if(block.rows[0].length>1)block.rows.forEach(row=>row.pop())}),action('헤더 전환',()=>{block.header=!block.header}),action('표 삭제',()=>box.remove())])tools.appendChild(button);
 draw();scroller.appendChild(table);box.appendChild(tools);box.appendChild(scroller);return box;
}

export function blockNode(b:Block):HTMLElement{
 if(b.type==='text'){const p=document.createElement('p');p.textContent=b.text;return p}
 if(b.type==='table')return tableNode(b);
 if(b.type==='image'||b.type==='video')return mediaNode(b.id,b.type);
 const box=document.createElement('div');box.contentEditable='false';box.className='editor-embed';box.dataset.embed=b.type;
 if(b.type==='youtube'){box.dataset.videoId=b.videoId;const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(b.videoId)+'?autoplay=0';frame.title='YouTube 영상';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';box.appendChild(frame)}
 else{box.dataset.url=b.url;const id=tiktokId(b.url);if(id){box.classList.add('tiktok-editor-embed');const frame=document.createElement('iframe');frame.src='https://www.tiktok.com/player/v1/'+encodeURIComponent(id)+'?controls=1&description=1&music_info=1&autoplay=0';frame.title='TikTok 영상';frame.allow='fullscreen; autoplay; encrypted-media';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';box.appendChild(frame)}else{const p=document.createElement('p');p.textContent='↗ '+b.url;box.appendChild(p)}}
 const remove=document.createElement('button');remove.type='button';remove.textContent='첨부 빼기';remove.onmousedown=e=>e.preventDefault();remove.onclick=()=>removeBlock(box);box.appendChild(remove);return box;
}

function removeBlock(box:HTMLElement){const root=box.closest<HTMLElement>('[role="textbox"]'),next=box.nextElementSibling;box.remove();if(root){ensureWritingSpace(root);root.focus();const range=document.createRange();range.selectNodeContents(next?.isConnected?next:root);range.collapse(true);const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);root.dispatchEvent(new Event('input',{bubbles:true}))}}
export function ensureWritingSpace(root:HTMLElement){const blank=()=>{const p=document.createElement('p');p.appendChild(document.createElement('br'));return p};for(const box of Array.from(root.querySelectorAll<HTMLElement>('[data-embed]'))){if(!box.previousSibling)box.parentNode!.insertBefore(blank(),box);if(!box.nextSibling||(box.nextSibling instanceof HTMLElement&&box.nextSibling.dataset.embed))box.parentNode!.insertBefore(blank(),box.nextSibling)}if(!root.firstChild)root.appendChild(blank())}
export function renderBlocks(root:HTMLElement,blocks:Block[]){root.replaceChildren();for(const b of blocks)root.appendChild(blockNode(b));ensureWritingSpace(root)}
export function insertFragment(root:HTMLElement,fragment:DocumentFragment){root.focus();const sel=window.getSelection(),range=sel?.rangeCount?sel.getRangeAt(0):null,last=fragment.lastChild;if(range&&root.contains(range.commonAncestorContainer)){range.deleteContents();range.insertNode(fragment);if(last){range.setStartAfter(last);range.collapse(true);sel?.removeAllRanges();sel?.addRange(range)}}else root.appendChild(fragment);ensureWritingSpace(root);if(last instanceof HTMLElement&&last.dataset.embed&&last.nextSibling){const caret=document.createRange();caret.selectNodeContents(last.nextSibling);caret.collapse(true);sel?.removeAllRanges();sel?.addRange(caret)}}

function delimitedTable(text:string):Extract<Block,{type:'table'}>|null {
 const lines=text.trim().split(/\r?\n/);if(lines.length<2)return null;
 const markdown=lines.length>2&&/^\s*\|?.+\|\s*$/.test(lines[0])&&/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[1]);
 const separator=markdown?'|':lines.every(line=>line.includes('\t'))?'\t':'';if(!separator)return null;
 const rows=(markdown?[lines[0],...lines.slice(2)]:lines).map(line=>separator==='|'?line.trim().replace(/^\||\|$/g,'').split('|').map(cell=>cell.trim().replace(/\\\|/g,'|')):line.split('\t').map(cell=>cell.trim()));
 return safeTable({type:'table',rows,header:markdown});
}

export function parseTableSource(source:string):Extract<Block,{type:'table'}>|null {
 const clean=DOMPurify.sanitize(source,{ALLOWED_TAGS:['table','thead','tbody','tfoot','tr','th','td'],ALLOWED_ATTR:[]});
 const table=new DOMParser().parseFromString(clean,'text/html').querySelector('table');return table?tableBlock(table):delimitedTable(source);
}
export function emptyTable():Extract<Block,{type:'table'}>{return {type:'table',header:true,rows:[['제목 1','제목 2'],['내용 1','내용 2']]}}

export function parsePaste(html:string,text:string){
 const fragment=document.createDocumentFragment(),pending:{node:HTMLElement;url:string;kind:'image'|'video'}[]=[];
 const appendText=(value:string,target:Node)=>{for(const b of splitLinks(value)){if(b.type==='text')target.appendChild(document.createTextNode(b.text));else target.appendChild(blockNode(b))}};
 if(!html||isPlainUrlPaste(text)){const table=delimitedTable(text);if(table)fragment.appendChild(blockNode(table));else appendText(text.trim(),fragment);return {fragment,pending}}
 const clean=DOMPurify.sanitize(html,{ALLOWED_TAGS:['a','p','div','span','br','blockquote','ul','ol','li','h1','h2','h3','h4','h5','h6','figure','img','video','source','iframe','table','thead','tbody','tfoot','tr','th','td'],ALLOWED_ATTR:['href','src','data-src','data-original','data-lazy-src']});
 const doc=new DOMParser().parseFromString(clean,'text/html');
 const walk=(n:Node,target:Node)=>{if(n.nodeType===Node.TEXT_NODE){appendText(n.textContent||'',target);return}if(!(n instanceof HTMLElement))return;if(n.tagName==='TABLE'){const table=tableBlock(n as HTMLTableElement);if(table)target.appendChild(blockNode(table));return}if(n.tagName==='IFRAME'){const src=n.getAttribute('src')||'',b=splitLinks(src);if(b.length===1&&b[0].type==='youtube')target.appendChild(blockNode(b[0]));return}if(n.tagName==='IMG'||n.tagName==='VIDEO'){const kind=n.tagName==='VIDEO'?'video':'image',url=n.getAttribute('data-original')||n.getAttribute('data-src')||n.getAttribute('src')||n.getAttribute('data-lazy-src')||n.querySelector('source')?.getAttribute('src')||'',node=document.createElement('span');node.className='failed-media';node.style.display='block';node.contentEditable='false';node.dataset.status='pending';node.textContent='첨부를 확인하고 있어요…';target.appendChild(node);pending.push({node,url,kind});return}if(n.tagName==='BR'){target.appendChild(document.createElement('br'));return}if(n.tagName==='A'){const href=n.getAttribute('href')||'';if(/^https?:\/\//.test(href)&&!n.querySelector('img')){appendText(href,target);return}}const block=/^(DIV|P|LI|H[1-6]|BLOCKQUOTE|FIGURE)$/.test(n.tagName),el=block?document.createElement('div'):target;n.childNodes.forEach(child=>walk(child,el));if(block)target.appendChild(el)};
 doc.body.childNodes.forEach(n=>walk(n,fragment));return {fragment,pending};
}
