'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {verifyPackageContents}=require('../scripts/verify-package-contents.cjs');
const manifest={n8n:{nodes:['dist/node.js'],credentials:['dist/oauth.js']}};
const good=['package.json','dist/node.js','dist/oauth.js','dist/icon.svg','README.md','LICENSE'];
const files=paths=>paths.map(path=>({path}));
test('registered nodes and OAuth credentials must be in the published package',()=>{
 assert.equal(verifyPackageContents(manifest,files(good)),3);
 for(const missing of ['dist/node.js','dist/oauth.js','package.json'])assert.throws(()=>verifyPackageContents(manifest,files(good.filter(p=>p!==missing))),/missing registered/);
});
test('build stores, secrets and archives cannot enter the package',()=>{
 for(const bad of ['.pnpm-store/a','dist/.pnpm-store/a','dist/.env','dist/.env.production','dist/node_modules/a','dist/old.tgz','backup.zip','tests/a.js'])assert.throws(()=>verifyPackageContents(manifest,files([...good,bad])),/Unexpected/);
});
test('empty registrations fail closed',()=>assert.throws(()=>verifyPackageContents({},files(good)),/registration/));
