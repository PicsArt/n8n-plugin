const {test}=require('node:test');
const assert=require('node:assert/strict');
const {executeGetVideoResult}=require('../dist/nodes/PicsartVideo/execute/executeGetVideoResult');
function ctx(response,id='saved-job') {
 const calls=[];
 return {calls,getNode:()=>({name:'Result',type:'test',typeVersion:1,parameters:{}}),getNodeParameter:(key)=>key==='transactionId'?id:'oAuth2',helpers:{httpRequestWithAuthentication:async(credential,options)=>{calls.push({credential,options});if(response instanceof Error)throw response;return response;}}};
}
for (const status of ['accepted','pending','processing','queued','submitted','running','in_progress']) test('pending '+status+' suppresses stale URL',async()=>{
 const c=ctx({status,data:{url:'https://example.com/stale.mp4'}}),out=[];await executeGetVideoResult(c,2,out);
 assert.equal(out[0].json.completed,false);assert.equal(out[0].json.video_url,undefined);assert.deepEqual(out[0].pairedItem,{item:2});assert.equal(c.calls.length,1);assert.equal(c.calls[0].options.method,'GET');assert.equal(c.calls[0].credential,'picsartOAuth2Api');
});
for(const status of ['success','completed'])test('completion '+status,async()=>{
 const c=ctx({status,transaction_id:'saved-job',data:{url:'https://example.com/done.mov'}}),out=[];await executeGetVideoResult(c,0,out);assert.equal(out[0].json.video_url,'https://example.com/done.mov');assert.equal(out[0].json.status,'success');assert.equal(out[0].json.transaction_id,'saved-job');
});
for(const response of [{status:'failed'},{status:'unknown'},{status:'success',data:{url:'http://example.com/a'}},{status:'success',data:{url:'https://u:p@example.com/a'}},{status:'success'},{status:'processing',transaction_id:'another-job'}])test('unsafe result rejected '+JSON.stringify(response),async()=>{
 const c=ctx(response);await assert.rejects(()=>executeGetVideoResult(c,0,[]),/saved-job/);assert.equal(c.calls.length,1);
});
test('404 retains task without classifying pending or retrying',async()=>{const c=ctx(Object.assign(new Error('missing'),{statusCode:404})),out=[];await executeGetVideoResult(c,0,out);assert.equal(out[0].json.status,'not_found');assert.equal(c.calls.length,1);});
test('401 retains task for recovery',async()=>{const c=ctx(Object.assign(new Error('unauthorized'),{statusCode:401}));await assert.rejects(()=>executeGetVideoResult(c,0,[]),/Authentication.*saved-job/);});
for(const id of ['', '../escape',' x','a?b'])test('invalid ID rejected before HTTP '+id,async()=>{const c=ctx({},id);await assert.rejects(()=>executeGetVideoResult(c,0,[]));assert.equal(c.calls.length,0);});
for(const envelope of ['data','result','top'])test('rejects non-string completed URLs in '+envelope,async()=>{
 for(const value of [['https://example.com/done.mp4'],{href:'https://example.com/done.mp4'},42,true]){
  const response={status:'success',...(envelope==='top'?{url:value}:{[envelope]:{url:value}})};
  const c=ctx(response),out=[];
  await assert.rejects(()=>executeGetVideoResult(c,0,out),/saved-job/);
  assert.equal(out.length,0);assert.equal(c.calls.length,1);assert.equal(c.calls[0].options.method,'GET');
 }
});
