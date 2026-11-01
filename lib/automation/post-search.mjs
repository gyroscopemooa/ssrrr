// Bind every value; treat SQL LIKE wildcards as literal search text.
export function postSearchTerms(value) {
  const query = String(value || '').trim().slice(0, 500);
  let id = query;
  try {
    const url = new URL(query, 'https://ssrrr.net');
    const match = url.pathname.match(/^\/post\/([^/]+)\/?$/);
    if (match) id = decodeURIComponent(match[1]);
  } catch { /* Invalid links are still searchable as titles. */ }
  return { query, id, title: '%' + query.replace(/[!%_]/g, '!$&') + '%' };
}
