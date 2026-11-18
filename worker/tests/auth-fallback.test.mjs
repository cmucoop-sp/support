import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as source from '../index.js';
import {D1} from './d1.mjs';

async function checkSessions(module) {
 const DB=new D1();await DB.install(module.SCHEMA);
 for(const username of ['tester.name','ผู้ใช้.ทดสอบ','normal'])DB.db.prepare('INSERT INTO users(username,salt,hash,role,name,perms) VALUES(?,?,?,?,?,?)').run(username,'salt',await module.sha256hex('salt|pass1234'),'viewer',username,'{}');
 const execute=DB.execute.bind(DB);
 DB.execute=q=>{if(/^(?:INSERT|UPDATE|DELETE).*sessions/i.test(q.sql))throw new Error("D1_ERROR: Your account has exceeded D1's free tier daily row write limit.");return execute(q);};
 const C={env:{DB}};
 for(const username of ['tester.name','ผู้ใช้.ทดสอบ','normal']){
  const login=await module.API.login(C,username,'pass1234');
  assert.ok(login.token.startsWith('s1.'));
  assert.equal((await module.API.whoami(C,login.token)).user,username);
  await assert.rejects(module.API.whoami(C,login.token.slice(0,-1)+'x'),/SESSION_EXPIRED/);
  const pieces=login.token.split('.');pieces[pieces.length-2]=String(Date.now()-1000);
  await assert.rejects(module.API.whoami(C,pieces.join('.')),/SESSION_EXPIRED/);
 }
}
test('fallback sessions accept dotted and Thai usernames and reject tampered or expired tokens',()=>checkSessions(source));
test('Dashboard Worker has the same schema and APIs and supports the repaired fallback sessions',async()=>{
 const text=await fs.readFile(new URL('../../Cloudflare-Worker/worker-copy.txt',import.meta.url),'utf8');
 const bundled=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
 assert.deepEqual(Object.keys(bundled.API).sort(),Object.keys(source.API).sort());
 assert.deepEqual(bundled.SCHEMA,source.SCHEMA);
 await checkSessions(bundled);
});


test('user login links are masked at rest in D1 and never stored as plaintext keys', async () => {
  const DB = new D1(); await DB.install(source.SCHEMA);
  const C = { env: { DB, LINK_SECRET: 'test-secret-key' } };
  await source.API.login(C, '0000', '0000').catch(() => {});
  DB.db.prepare('INSERT OR REPLACE INTO users(username,salt,hash,role,name,perms) VALUES(?,?,?,?,?,?)').run('admin', 'salt', await source.sha256hex('salt|pass1234'), 'admin', 'Admin', '{}');
  DB.db.prepare('INSERT OR REPLACE INTO sessions(token,username,exp) VALUES(?,?,?)').run('adm-tok', 'admin', Date.now() + 86400000);
  const created = await source.API.saveUser(C, 'adm-tok', { username: 'staff01', name: 'พนักงาน 1', role: 'viewer', linkMode: true, perms: { barcode: true } });
  assert.ok(created.link.includes('?u=staff01&k='));
  const rawKey = new URLSearchParams(created.link.slice(1)).get('k');
  const row = DB.db.prepare('SELECT login_key FROM user_login_links WHERE username=?').get('staff01');
  assert.ok(row.login_key.startsWith('lk1:'), 'stored login_key is masked with lk1: prefix');
  assert.notEqual(row.login_key, rawKey, 'raw login key is never stored in plaintext');
  const retrieved = await source.API.getUserLink(C, 'adm-tok', 'staff01');
  assert.equal(retrieved.available, true);
  assert.equal(retrieved.link, created.link);
});
