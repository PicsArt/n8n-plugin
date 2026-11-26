const {test}=require('node:test');
const assert=require('node:assert/strict');
const {PicsartVideo}=require('../dist/nodes/PicsartVideo/PicsartVideo.node');
function context(urls,response={transaction_id:'saved-job',status:'accepted'},auth='oAuth2') {
 const calls=[];
 return {calls,getInputData:()=>[{json:{}}],continueOnFail:()=>false,getNode:()=>({name:'Combine',type:'test',typeVersion:1,parameters:{}}),getNodeParameter:(k)=>({operation:'combineVideos',videoUrls:urls,authentication:auth})[k],helpers:{httpRequestWithAuthentication:async(credential,options)=>{calls.push({credential,options});if(response instanceof Error)throw response;return options.method === 'GET' ? {status:'success',transaction_id:'saved-job',data:{url:'https://example.com/final.mp4'}} : response;}}};
}
for(const auth of ['oAuth2','apiKey'])test('ordered submit once with '+auth,async()=>{
 const c=context('https://example.com/b.mp4\nhttps://example.com/a.mp4',undefined,auth);
 const [out]=await new PicsartVideo().execute.call(c);
 assert.equal(c.calls.length,2);assert.equal(c.calls[1].options.method,'GET');assert.equal(c.calls[0].credential,auth==='oAuth2'?'picsartOAuth2Api':'picsartApi');
 assert.deepEqual(c.calls[0].options.body,{items:[{video_url:'https://example.com/b.mp4',transition:'none'},{video_url:'https://example.com/a.mp4',transition:'none'}],export:{format:'MP4',frame_rate:30}});
 assert.equal(out[0].json.transaction_id,'saved-job');assert.equal(out[0].json.completed,true);assert.equal(out[0].json.video_url,'https://example.com/final.mp4');assert.deepEqual(out[0].pairedItem,{item:0});
});
for(const urls of ['', 'https://example.com/a',Array(11).fill('https://example.com/a').join('\n'),'http://example.com/a\nhttps://example.com/b','https://u:p@example.com/a\nhttps://example.com/b','invalid\nhttps://example.com/b'])test('reject invalid input before HTTP '+urls.slice(0,25),async()=>{const c=context(urls);await assert.rejects(()=>new PicsartVideo().execute.call(c));assert.equal(c.calls.length,0);});
for(const response of [{}, {transaction_id:'saved-job',status:'failed'}, {transaction_id:'saved-job',status:'unknown'},new Error('timeout')])test('submission failure does not retry '+JSON.stringify(response),async()=>{const c=context('https://example.com/a\nhttps://example.com/b',response);await assert.rejects(()=>new PicsartVideo().execute.call(c),e=>{assert.match(e.message,/Do not automatically resubmit/);if(response.transaction_id)assert.match(e.message,/saved-job/);return true;});assert.equal(c.calls.length,1);});
test('schema exposes a distinct operation and multiline input',()=>{const p=new PicsartVideo().description.properties;assert(p.find(x=>x.name==='operation').options.some(x=>x.value==='combineVideos'));assert.deepEqual(p.find(x=>x.name==='videoUrls').displayOptions.show.operation,['combineVideos']);});
