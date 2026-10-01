import {safeLink} from './models';

/** Ignore editor spacer characters, without removing meaningful emoji joiners. */
export function visibleText(text: string) {
  const value = text.replace(/[\u200B\uFEFF]/g, '').replace(/\u00a0/g, ' ');
  return /[^\s\u200C\u200D\u2060]/u.test(value) ? value.trim() : '';
}
/** Splits a trailing "출처:" block (title line + URL line pairs) from an economy post body. */
export function splitSources(text: string) {
  const m = /\n[ \t]*출처[ \t]*:?[ \t]*\n/.exec(text);
  if (!m) return null;
  const items: {label: string; url: string}[] = [];
  let label = '';
  for (const line of text.slice(m.index + m[0].length).split('\n').map(l => l.trim()).filter(Boolean)) {
    if (/^https?:\/\//i.test(line)) {
      const url = safeLink(line);
      if (url) items.push({label: label || new URL(url).hostname.replace(/^www\./, ''), url});
      label = '';
    } else label = line;
  }
  return items.length ? {main: text.slice(0, m.index).trimEnd(), items} : null;
}
