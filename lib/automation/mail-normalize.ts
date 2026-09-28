const TASK_UPDATE_PREFIX = /^\s*\[Task Update\]\s*([^:\r\n]{1,200}):\s*(.+?)\s*$/i;

export function isTaskUpdatePreview(subject: string, body: string) {
  return /^\s*\[Task Update\]/i.test(subject) &&
    (/\bView message\b/i.test(body) || /(?:\u2026|\.\.\.)\s*(?:View message)?\s*$/i.test(body.trim()));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function comparable(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function cleanBody(rawBody: string, remove: string[]) {
  let lines = rawBody
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B\uFEFF]/g, '')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim());

  const footerMarker = lines.findIndex(line => /^(?:unsubscribe|수신거부|privacy\s*[·|/]\s*terms|openai\s*©)/i.test(line));
  if (footerMarker >= 0) {
    let start = footerMarker;
    for (let i = footerMarker - 1; i >= Math.max(0, footerMarker - 10); i--) {
      if (/^openai$/i.test(lines[i])) { start = i; break; }
    }
    lines = lines.slice(0, start);
  } else {
    const companyFooter = lines.findIndex((line, index) => /^openai$/i.test(line) && lines.slice(index + 1, index + 7).some(next => /(?:\d{2,6}\s+.+(?:street|st\.?|road|rd\.?|avenue|ave\.?|boulevard|blvd\.?)|san francisco,?\s+ca)/i.test(next)));
    if (companyFooter >= 0) lines = lines.slice(0, companyFooter);
  }

  const removed = new Set(remove.filter(Boolean).map(comparable));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    if (!line) {
      if (result.length && result.at(-1) !== '') result.push('');
      continue;
    }
    if (/^(?:view|open|read)(?: the)? message$/i.test(line)) continue;
    const key = comparable(line);
    if (removed.has(key)) continue;
    if (key.length >= 40 && seen.has(key)) continue;
    if (key.length >= 40) seen.add(key);
    result.push(line);
  }
  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function normalizeAutomationMail(subject: string, rawBody: string) {
  const originalSubject = subject.trim();
  const match = TASK_UPDATE_PREFIX.exec(originalSubject);
  const privateTaskLabel = match?.[1]?.trim() || '';
  const title = (match?.[2]?.trim() || originalSubject).slice(0, 120);
  let body = rawBody;
  if (originalSubject) body = body.replace(new RegExp(escapeRegex(originalSubject), 'giu'), '');
  body = body.replace(/^\s*\[Task Update\]\s*/gim, '').replace(/^\s*:\s*/gm, '');
  return { title, body: cleanBody(body, [originalSubject, privateTaskLabel, title]) };
}

export function normalizeStoredEconomyPost(title: string, storedBody: string) {
  let blocks: Array<{type:string;text?:string;[key:string]:unknown}> = [];
  try { const value = JSON.parse(storedBody); if (Array.isArray(value)) blocks = value } catch {}
  if (!blocks.length) blocks = [{type:'text', text:storedBody}];
  const text = blocks.filter(block => block.type === 'text' && typeof block.text === 'string').map(block => block.text).join('\n\n');
  const clean = normalizeAutomationMail(title, text);
  let inserted = false;
  const cleanBlocks = blocks.flatMap(block => {
    if (block.type !== 'text') return [block];
    if (inserted || !clean.body) return [];
    inserted = true;
    return [{...block, text:clean.body}];
  });
  if (!inserted && clean.body) cleanBlocks.unshift({type:'text', text:clean.body});
  return {title:clean.title, body:JSON.stringify(cleanBlocks), text:clean.body};
}
