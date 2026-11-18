const {test}=require('node:test'),assert=require('node:assert/strict');
const delay=require('../dist/nodes/PicsartGeneration/execute/pollDelay');
test('generation first read is immediate and subsequent read waits two seconds',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});await delay.waitBeforeGenerationPoll(0);let done=false;const p=delay.waitBeforeGenerationPoll(1).then(()=>done=true);t.mock.timers.tick(1999);await Promise.resolve();assert.equal(done,false);t.mock.timers.tick(1);await p;assert.equal(done,true);
});
for(const media of ['Audio','Video']){
 const poll=require('../dist/nodes/PicsartGeneration/execute/poll'+media+'Inference');
 const fn=poll['pollUntil'+media+'Ready'];
 const context=queue=>({getNode:()=>({name:'Generation',type:'test',typeVersion:1,parameters:{}}),getNodeParameter:()=> 'oAuth2',helpers:{httpRequestWithAuthentication:async(credential,options)=>{assert.equal(credential,'picsartOAuth2Api');assert.equal(options.method,'GET');const r=queue.shift()??{status:'processing'};if(r instanceof Error)throw r;return r;}}});
 test(media+' waits after pending and404, without resubmission',async t=>{const attempts=[];t.mock.method(delay,'waitBeforeGenerationPoll',async n=>attempts.push(n));const r=await fn(context([{status:'processing'},Object.assign(Error('not ready'),{statusCode:404}),{status:'success',data:{url:'https://example.com/result'}}]),'saved-job',0);assert.deepEqual(attempts,[0,1,2]);assert.equal(r[media.toLowerCase()+'Url'],'https://example.com/result');});
 test(media+' HTTP errors preserve identity and accepted task',async t=>{t.mock.method(delay,'waitBeforeGenerationPoll',async()=>{});const err=Object.assign(Error('denied'),{statusCode:401});await assert.rejects(fn(context([err]),'saved-job',0),e=>e===err&&e.statusCode===401&&/saved-job.*do not resubmit/.test(e.message));});
 test(media+' exhaustion and terminal failure retain task',async t=>{let count=0;t.mock.method(delay,'waitBeforeGenerationPoll',async()=>count++);await assert.rejects(fn(context([]),'saved-job',0),/600 polling attempts.*saved-job.*do not resubmit/);assert.equal(count,600);await assert.rejects(fn(context([{status:'failed'}]),'saved-job',0),/saved-job.*do not resubmit/);});
 test(media+' task URL encodes opaque IDs',()=>assert.match(poll[media.toLowerCase()+'InferenceUrl']('a/b?c'),/a%2Fb%3Fc$/));
}
