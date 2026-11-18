const {test}=require('node:test');
const assert=require('node:assert/strict');
const polling=require('../dist/nodes/PicsartVideo/execute/polling');
const {executeTrim}=require('../dist/nodes/PicsartVideo/execute/executeTrim');
const {executeCompressVideo}=require('../dist/nodes/PicsartVideo/execute/executeCompressVideo');
const videoExecutors = [
 ['trim', executeTrim], ['compression', executeCompressVideo],
 ...['Crop', 'CtvEncode', 'Fit', 'FpsUpscale', 'MuteVideo', 'VideoEffects', 'VideoHighlights', 'VideoToGif'].map(name => [name, require('../dist/nodes/PicsartVideo/execute/execute' + name)['execute' + name]]),
 ['Watermark', require('../dist/nodes/PicsartVideo/execute/executeWatermart').executeWatermark],
];
test('video retry delay is two seconds; initial poll is immediate',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 await polling.waitBeforeVideoPoll(0);
 let done=false;const wait=polling.waitBeforeVideoPoll(1).then(()=>{done=true;});
 t.mock.timers.tick(1999);await Promise.resolve();assert.equal(done,false);
 t.mock.timers.tick(1);await wait;assert.equal(done,true);
});
function context(responses){
 const calls=[];const p={authentication:'oAuth2',videoUrl:'https://example.com/test.mp4',start:0,end:4000,cropExportFormat:'MP4',mode:'simple',max_size_mb:8,width:64,height:96,fitRatio:0.5625,effectName:'black_and_white',format:'MP4',watermarkSource:'url',watermarkUrl:'https://example.com/logo.png',trimSegments:{segment:[{start:0,end:1000},{start:2000,end:3000}]}};
 return {calls,getNode:()=>({name:'Video',type:'test',typeVersion:1,parameters:{}}),getNodeParameter:(k,i,d)=>p[k]??d,helpers:{
 httpRequestWithAuthentication:async (credential,options)=>{calls.push({credential,options});const response=responses.length?responses.shift():{status:'processing'};if(response instanceof Error)throw response;return response;},
 httpRequest:async()=>Buffer.from('test video'),prepareBinaryData:async()=>({data:'dGVzdA==',mimeType:'video/mp4'})}};
}
for(const [name,execute]of [['trim',executeTrim],['compression',executeCompressVideo]]){
 test(name+': pending and 404 retries wait; completion downloads without resubmission',async t=>{
 const attempts=[];t.mock.method(polling,'waitBeforeVideoPoll',async n=>{attempts.push(n);});
 const e=Object.assign(new Error('Not ready'),{statusCode:404});
 const c=context([{transaction_id:'job'},e,{status:'processing'},{status:'success',data:{url:'https://example.com/result.mp4'}}]);const out=[];
 await execute(c,0,out);assert.deepEqual(attempts,[0,1,2]);assert.equal(out.length,1);
 assert.equal(c.calls.filter(x=>x.options.method==='POST').length,1);
 assert(c.calls.every(x=>x.credential==='picsartOAuth2Api'));
 });
 test(name+': terminal failure stops and exhaustion retains task ID',async t=>{
 t.mock.method(polling,'waitBeforeVideoPoll',async()=>{});
 let c=context([{transaction_id:'job'},{status:'failed',message:'Cannot process'}]);
 await assert.rejects(execute(c,0,[]),/failed/i);assert.equal(c.calls.length,2);
 c=context([{transaction_id:'existing-job'}]);await assert.rejects(execute(c,0,[]),/300 polling attempts.*existing-job/);
 assert.equal(c.calls.length,301);assert.equal(c.calls.filter(x=>x.options.method==='POST').length,1);
 });
}

for (const [name, execute] of videoExecutors) {
 for (const statusCode of [403, 500]) {
  test(`${name}: polling HTTP ${statusCode} preserves accepted job and never resubmits`, async t => {
   t.mock.method(polling, 'waitBeforeVideoPoll', async () => {});
   const c = context([{transaction_id: 'accepted-job'}, Object.assign(new Error('poll failed'), {statusCode})]);
   await assert.rejects(execute(c, 0, []), /Accepted transaction ID: accepted-job.*Retrieve this existing transaction/);
   assert.equal(c.calls.filter(x => x.options.method === 'POST').length, 1);
  });
 }
 test(`${name}: download failure preserves accepted job`, async t => {
  t.mock.method(polling, 'waitBeforeVideoPoll', async () => {});
  const c = context([{transaction_id: 'download-job'}, {status: 'success', data: {url: 'https://example.com/result.mp4'}}]);
  c.helpers.httpRequest = async () => { throw new Error('download unavailable'); };
  await assert.rejects(execute(c, 0, []), /Accepted transaction ID: download-job/);
  assert.equal(c.calls.filter(x => x.options.method === 'POST').length, 1);
 });
 test(`${name}: submission failure does not invent an accepted job`, async () => {
  const c = context([Object.assign(new Error('submission denied'), {statusCode: 403})]);
  await assert.rejects(execute(c, 0, []), error => {
   assert.match(error.message, /submission denied/);
   assert.doesNotMatch(error.message, /Accepted transaction ID/);
   return true;
  });
  assert.equal(c.calls.length, 1);
 });
}
