const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const {version}=require('../package.json');
const run=tag=>spawnSync(process.execPath,[path.join(__dirname,'../scripts/verify-release-tag.cjs')],{env:{...process.env,RELEASE_TAG:tag},encoding:'utf8'});
test('release accepts only the exact package version tag',()=>{
 assert.equal(run(`v${version}`).status,0);
 for(const tag of ['',version,'v0.0.0','main',`v${version}-other`]){
  const result=run(tag);assert.equal(result.status,1);assert.match(result.stderr,/No package will be published/);
 }
});
