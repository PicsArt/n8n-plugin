const {test}=require('node:test');
const assert=require('node:assert/strict');
const {PicsartAudio}=require('../dist/nodes/PicsartAudio/PicsartAudio.node.js');
const node=new PicsartAudio();
function context(items,responses,keepGoing=false){
 const calls=[];
 return {calls,getInputData:()=>items.map(()=>({json:{}})),getNodeParameter:(key,i,fallback)=>items[i][key]??fallback,getNode:()=>({name:'Audio',type:'picsartAudio',typeVersion:1,parameters:{}}),continueOnFail:()=>keepGoing,helpers:{httpRequestWithAuthentication:async(credential,options)=>{calls.push({credential,options});if(!responses.length)throw new Error('Unexpected request');return responses.shift();}}};
}
const accepted={status:'success',response:{id:'task-1',status:'SUBMITTED'}};
test('music uses n8n OAuth and preserves optional media references',async()=>{
 const ctx=context([{operation:'generate_music',model:'lyria-3-pro',prompt:'Piano',advanced:{imageUrls:'https://example.com/a.png\nhttps://example.com/b.png'}}],[accepted]);
 const out=await node.execute.call(ctx);
 assert.equal(ctx.calls.length,1);assert.equal(ctx.calls[0].credential,'picsartOAuth2Api');
 assert.deepEqual(ctx.calls[0].options.body,{params:{model:'lyria-3-pro',params:{prompt:'Piano',imageUrls:['https://example.com/a.png','https://example.com/b.png']}}});
 assert.equal(out[0][0].json.task_id,'task-1');assert.equal(out[0][0].json.completed,false);
});
test('voice controls preserve false and zero',async()=>{
 const ctx=context([{operation:'text_to_speech',model:'eleven-v3',prompt:'Hello',advanced:{stability:0,useSpeakerBoost:false}}],[accepted]);
 await node.execute.call(ctx);assert.equal(ctx.calls[0].options.body.params.params.stability,0);assert.equal(ctx.calls[0].options.body.params.params.useSpeakerBoost,false);
});
for(const item of [
 {operation:'generate_music',model:'eleven-v3',prompt:'x'},
 {operation:'generate_music',model:'lyria-3-pro',prompt:' '},
 {operation:'generate_sound_effects',model:'elevenlabs-sfx',prompt:'x',advanced:{duration:31}},
 {operation:'generate_music',model:'lyria-3-pro',prompt:'x',advanced:{unsupported:true}},
 {operation:'isolate_audio',model:'eleven-audio-isolation',audioUrl:'http://example.com/a.mp3'},
 {operation:'isolate_audio',model:'eleven-audio-isolation',audioUrl:'https://user:secret@example.com/a.mp3'},
])test('rejects invalid configuration before network: '+JSON.stringify(item),async()=>{
 const ctx=context([item],[]);await assert.rejects(node.execute.call(ctx));assert.equal(ctx.calls.length,0);
});
test('pending result suppresses stale media and encodes task id',async()=>{
 const ctx=context([{operation:'get_audio_result',taskId:'a/b'}],[{status:'success',response:{status:'PROCESSING',result:{url:'https://example.com/old.mp3'}}}]);
 const out=await node.execute.call(ctx);assert.ok(ctx.calls[0].options.url.endsWith('/a%2Fb/result'));assert.equal(ctx.calls[0].options.method,'GET');assert.equal(out[0][0].json.url,undefined);
});
for(const response of [{status:'FAILED',result:{url:'https://example.com/old.mp3'}},{status:'COMPLETED'},{status:'UNKNOWN'}])test('rejects unusable result '+response.status,async()=>{
 const ctx=context([{operation:'get_audio_result',taskId:'x'}],[{status:'success',response}]);await assert.rejects(node.execute.call(ctx));assert.equal(ctx.calls.length,1);
});
test('completed result returns actual media without authenticated CDN request',async()=>{
 const ctx=context([{operation:'get_audio_result',taskId:'x'}],[{status:'success',response:{status:'COMPLETED',result:{items:[{url:'https://example.com/audio.wav'}]}}}]);
 const out=await node.execute.call(ctx);assert.equal(out[0][0].json.url,'https://example.com/audio.wav');assert.equal(ctx.calls.length,1);
});
test('continue on fail preserves pairing for following items',async()=>{
 const ctx=context([{operation:'generate_music',model:'bad',prompt:'x'},{operation:'generate_music',model:'lyria-3-pro',prompt:'Piano'}],[accepted],true);
 const out=await node.execute.call(ctx);assert.equal(out[0].length,2);assert.ok(out[0][0].json.error);assert.deepEqual(out[0][1].pairedItem,{item:1});
});
test('forms expose creative inputs and place optional controls in Advanced',()=>{
 const props=node.description.properties;
 assert.ok(!props.some(p=>p.name==='params_json'));
 assert.ok(props.some(p=>p.name==='prompt'&&p.required&&p.displayOptions.show.model.includes('lyria-3-pro')));
 assert.ok(props.some(p=>p.name==='advanced'&&p.type==='collection'&&p.displayOptions.show.model.includes('eleven-v3')));
 assert.deepEqual(node.description.credentials,[{name:'picsartOAuth2Api',required:true}]);
});
const registry=require('../nodes/PicsartAudio/registry.json');
const {NodeHelpers}=require('n8n-workflow');
for(const [operation,group] of Object.entries(registry.groups))test('n8n resolves correct model for '+operation,()=>{
 const saved={name:'Audio',type:'picsartAudio',typeVersion:1,parameters:{operation}};
 const params=NodeHelpers.getNodeParameters(node.description.properties,{operation},true,false,saved);
 assert.equal(params.model,group.models[0]);
 assert.ok(!Object.hasOwn(params,'params_json'));
});
test('Seed single-image list and false/zero controls survive normalization',async()=>{
 const ctx=context([{operation:'text_to_speech',model:'seed-audio-1.0',prompt:'Hello',advanced:{imageUrls:'https://example.com/ref.png',speechRate:0,aigcWatermark:false}}],[accepted]);
 await node.execute.call(ctx);assert.deepEqual(ctx.calls[0].options.body.params.params,{prompt:'Hello',imageUrls:['https://example.com/ref.png'],speechRate:0,aigcWatermark:false});
});
test('video soundtrack needs video and submits video list exactly once',async()=>{
 const missing=context([{operation:'generate_audio_from_video',model:'kling-v2a'}],[]);
 await assert.rejects(node.execute.call(missing));assert.equal(missing.calls.length,0);
 const ctx=context([{operation:'generate_audio_from_video',model:'eleven-video-to-music',prompt:'Quiet strings',videoUrls:'https://example.com/clip.mp4'}],[accepted]);
 await node.execute.call(ctx);assert.equal(ctx.calls.length,1);assert.deepEqual(ctx.calls[0].options.body.params.params.videoUrls,['https://example.com/clip.mp4']);
});
test('oversized submission ID is not accepted for later polling',async()=>{
 const ctx=context([{operation:'generate_music',model:'lyria-3-pro',prompt:'Piano'}],[{status:'success',response:{id:'x'.repeat(513)}}]);
 await assert.rejects(node.execute.call(ctx));assert.equal(ctx.calls.length,1);
});
test('completed audio preserves all clips and deduplicates primary URL',async()=>{
 const ctx=context([{operation:'get_audio_result',taskId:'x'}],[{status:'success',response:{status:'COMPLETED',result:{url:'https://example.com/a.wav',items:[{url:'https://example.com/a.wav'},{url:'https://example.com/b.wav'}]}}}]);
 const out=await node.execute.call(ctx);assert.deepEqual(out[0][0].json.urls,['https://example.com/a.wav','https://example.com/b.wav']);assert.equal(out[0][0].json.url,out[0][0].json.urls[0]);
});
for(const items of [[{url:'https://example.com/a.wav'},{url:'http://example.com/b.wav'}],[{url:'https://example.com/a.wav'},{}],{}])test('invalid secondary media is rejected '+JSON.stringify(items),async()=>{
 const ctx=context([{operation:'get_audio_result',taskId:'x'}],[{status:'success',response:{status:'COMPLETED',result:{url:'https://example.com/a.wav',items}}}]);
 await assert.rejects(node.execute.call(ctx));assert.equal(ctx.calls.length,1);
});
test('synthetic voice preview items remain paired with generated voice IDs and are hidden while pending',async()=>{
 const fixture=require('./fixtures/voice-design-result.json');
 for(const status of ['COMPLETED','PROCESSING']){
  const ctx=context([{operation:'get_audio_result',taskId:'saved'}],[{status:'success',response:{status,result:fixture}}]);
  const out=(await node.execute.call(ctx))[0][0];
  assert.deepEqual(out.pairedItem,{item:0});
  if(status==='COMPLETED'){
   assert.deepEqual(out.json.items,fixture.items);
   assert.equal(new Set(out.json.items.map(item=>item.metadata.generatedVoiceId)).size,3);
  }else assert.equal(Object.hasOwn(out.json,'items'),false);
  assert.equal(ctx.calls.length,1);
 }
});

test('Kling-shaped fixture retains MP4 media without downloading or relabeling as audio',async()=>{
 const fixture=require('./fixtures/video-audio-result.json');
 const ctx=context([{operation:'get_audio_result',taskId:fixture.task_id}],[{status:'success',response:{status:fixture.status,result:fixture.result}}]);
 const out=(await node.execute.call(ctx))[0][0];
 assert.equal(out.json.url,fixture.url);assert.deepEqual(out.json.urls,fixture.urls);
 assert.deepEqual(out.json.items,fixture.items);assert.deepEqual(out.json.result,fixture.result);
 assert.equal(out.json.completed,true);assert.equal(out.binary,undefined);
 assert.equal(ctx.calls.length,1);assert.equal(ctx.calls[0].options.method,'GET');
});

for(const status of ['PROCESSING','COMPLETED'])test('reject response belonging to another task '+status,async()=>{
 const ctx=context([{operation:'get_audio_result',taskId:'requested'}],[{status:'success',response:{id:'other',status,result:{url:'https://example.com/wrong.wav'}}}]);
 await assert.rejects(node.execute.call(ctx),/task ID does not match/);assert.equal(ctx.calls.length,1);
});
