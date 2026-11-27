const {test}=require('node:test');
const assert=require('node:assert/strict');
for(const name of ['Trim','Fit']) {
 const execute=require('../dist/nodes/PicsartVideo/execute/execute'+name)['execute'+name];
 test(name+' rejects non-string video URLs with an actionable validation error before requests',async()=>{
  for(const value of [['https://example.com/video.mp4'],{toString:()=> 'https://example.com/video.mp4'},42,true]) {
   let calls=0;
   const c={getNode:()=>({name,type:'test',typeVersion:1,parameters:{}}),getNodeParameter:(k,i,d)=>k==='videoUrl'?value:d,helpers:{httpRequestWithAuthentication:async()=>{calls++;throw Error('unexpected request')}}};
   await assert.rejects(()=>execute(c,0,[]),/Video URL must be a string/);
   assert.equal(calls,0);
  }
 });
}
