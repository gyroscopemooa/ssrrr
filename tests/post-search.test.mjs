import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { postSearchTerms } from '../lib/automation/post-search.mjs';

test('shorts search uses the actual route SQL for titles, IDs and post links', () => {
  const database = new DatabaseSync(':memory:');
  database.exec(`CREATE TABLE posts(id TEXT,title TEXT,hidden INTEGER);
    INSERT INTO posts VALUES ('one','고양이 유머',0),('two','100%_완료!',0),('hidden','고양이 비공개',1);`);
  const route = readFileSync(new URL('../app/api/ops/route.ts', import.meta.url), 'utf8');
  const where = route.match(/FROM posts p WHERE (p.hidden=0 AND \(p.title LIKE .*?p.id=\?\))/)[1];
  const statement = database.prepare('SELECT p.id FROM posts p WHERE ' + where);
  const search = value => { const terms = postSearchTerms(value); return statement.all(terms.title, terms.id).map(row => row.id); };
  assert.deepEqual(search(' 고양이 '), ['one']);
  assert.deepEqual(search('one'), ['one']);
  assert.deepEqual(search('https://ssrrr.net/post/one?from=search'), ['one']);
  assert.deepEqual(search('/post/one'), ['one']);
  assert.deepEqual(search('%_'), ['two']);
  assert.deepEqual(search('!'), ['two']);
  assert.deepEqual(search("' OR 1=1 --"), []);
  assert.deepEqual(search('없음'), []);
  assert.deepEqual(search(''), ['one', 'two']);
  database.close();
});
