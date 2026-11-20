const {test}=require('node:test');
const assert=require('node:assert/strict');
const {executeText2Video}=require('../dist/nodes/PicsartGeneration/execute/executeText2Video');
for(const key of ['text2VideoWidth','text2VideoHeight','text2VideoLength']) {
 for(const value of [NaN,Infinity,-Infinity,'64']) {
  test(`${key} rejects ${String(value)} (${typeof value}) before HTTP`,async()=>{
   let calls=0;
   const params={text2VideoPrompt:'A mug',text2VideoWidth:480,text2VideoHeight:480,text2VideoLength:4,[key]:value};
   const ctx={getNode:()=>({name:'Generation',type:'test',typeVersion:1,parameters:{}}),getNodeParameter:(k,i,d)=>Object.hasOwn(params,k)?params[k]:d,helpers:{httpRequestWithAuthentication:async()=>{calls++;throw new Error('Unexpected paid submission');}}};
   await assert.rejects(executeText2Video(ctx,0,[]),/must be between/);
   assert.equal(calls,0);
  });
 }
}
