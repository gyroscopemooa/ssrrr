import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {runInNewContext} from 'node:vm';

// Run against a built preview or deployment, not the JSX source: React/vinext
// can change script order while rendering the document.
const base = process.env.ANALYTICS_TEST_URL || 'http://127.0.0.1:8787';
for (const path of ['/', '/privacy']) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  const $ = load(await response.text());
  const scripts = $('head script').toArray();
  const init = $('head #google-tag-init');
  const loader = $('head script[src*="googletagmanager.com/gtag/js"]');
  assert.equal(init.length, 1, 'one server-rendered initialization');
  assert.equal(loader.length, 1, 'one Google tag loader');
  assert.equal(new URL(loader.attr('src')).searchParams.get('id'), 'G-VWPXY1F56T');
  assert.ok(loader.is('[async]'), 'loading must not block parsing');
  assert.ok(scripts.indexOf(init[0]) < scripts.indexOf($('#ezoic-cmp')[0]), 'queue exists before CMP');
  assert.ok(scripts.indexOf($('#ezoic-cmp-secondary')[0]) < scripts.indexOf(loader[0]), 'preserve CMP before tag loader');
  const context = {};
  context.window = context;
  runInNewContext(init.html(), context);
  assert.equal(typeof context.gtag, 'function');
  assert.equal(context.dataLayer.length, 2);
  assert.equal(context.dataLayer[0][0], 'js');
  assert.equal(context.dataLayer[1][0], 'config');
  assert.equal(context.dataLayer[1][1], 'G-VWPXY1F56T');
  console.log(`PASS ${new URL(path, base)}: SSR tag, execution order, and measurement ID`);
}
