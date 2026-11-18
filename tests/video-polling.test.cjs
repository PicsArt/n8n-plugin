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

test('trim exposes each time boundary once in the built editor schema',()=>{
 const {trimProperties}=require('../dist/nodes/PicsartVideo/properties/trimProperties');
 for(const name of ['videoUrl','start','end','cropExportFormat'])assert.equal(trimProperties.filter(p=>p.name===name).length,1,name+' must appear once');
 const end=trimProperties.find(p=>p.name==='end');assert.equal(end.type,'number');assert.equal(end.typeOptions.minValue,1);
 assert.deepEqual(end.displayOptions.show.operation,['Clip a Video']);
});

for (const [start,end] of [[NaN,3000],[0,NaN],[Infinity,3000],[0,Infinity],['1000',3000],[0,'3000'],[-1,3000],[0,0],[3000,3000],[3001,3000]]) {
 test(`trim rejects invalid timing before HTTP: ${String(start)} to ${String(end)}`,async()=>{
  const c=context([]),original=c.getNodeParameter;
  c.getNodeParameter=(key,i,d)=>key==='start'?start:key==='end'?end:original(key,i,d);
  await assert.rejects(executeTrim(c,0,[]),/finite numbers|Start must|End must/);
  assert.equal(c.calls.length,0);
 });
}
test('trim sends exact valid millisecond boundaries without coercion',async()=>{
 const c=context([{transaction_id:'timing-job'},{status:'success',data:{url:'https://example.com/result.mp4'}}]),original=c.getNodeParameter;
 c.getNodeParameter=(key,i,d)=>key==='start'?1000:key==='end'?3000:original(key,i,d);
 await executeTrim(c,0,[]);
 assert.equal(c.calls[0].options.body.start,1000);assert.equal(c.calls[0].options.body.end,3000);
});

for (const mode of ['simple','advanced']) test(`fit permits omitted optional dimensions in ${mode} mode`,async()=>{
 const {executeFit}=require('../dist/nodes/PicsartVideo/execute/executeFit');
 const c=context([{transaction_id:'fit-job'},{status:'success',data:{url:'https://example.com/result.mp4'}}]);
 const original=c.getNodeParameter;
 c.getNodeParameter=(key,i,fallback)=>{
  if(key==='mode')return mode;
  if(['fitRatio','fitWidth','fitHeight'].includes(key)){
   if(fallback===undefined)throw new Error('Could not get parameter '+key);
   return fallback;
  }
  return original(key,i,fallback);
 };
 await executeFit(c,0,[]);
 for(const key of ['ratio','width','height'])assert.equal(c.calls[0].options.body[key],undefined);
});

for(const bitrate of [undefined,1500])test('highlights advanced optional bitrate '+String(bitrate),async()=>{
 const {executeVideoHighlights}=require('../dist/nodes/PicsartVideo/execute/executeVideoHighlights');
 const c=context([{transaction_id:'highlights-job'},{status:'success',data:{url:'https://example.com/result.mp4'}}]),original=c.getNodeParameter;
 c.getNodeParameter=(key,i,fallback)=>{if(key==='mode')return 'advanced';if(key==='exportBitrate'){if(bitrate===undefined&&fallback===undefined)throw new Error('Could not get parameter exportBitrate');return bitrate??fallback;}return original(key,i,fallback);};
 await executeVideoHighlights(c,0,[]);assert.equal(c.calls[0].options.body.export.bitrate,bitrate);
 assert.deepEqual(c.calls[0].options.body.trim_segments,[{start:0,end:1000},{start:2000,end:3000}]);
});
for(const segment of [null,{start:0},{start:'0',end:500},{start:NaN,end:500},{start:0,end:Infinity}])test('highlights rejects malformed segment instead of dropping it: '+JSON.stringify(segment),async()=>{
 const {executeVideoHighlights}=require('../dist/nodes/PicsartVideo/execute/executeVideoHighlights');
 const c=context([]),original=c.getNodeParameter;
 c.getNodeParameter=(key,i,d)=>key==='trimSegments'?{segment:[{start:0,end:1000},segment,{start:2000,end:3000}]}:original(key,i,d);
 await assert.rejects(executeVideoHighlights(c,0,[]),/Every trim segment must have finite numeric/);assert.equal(c.calls.length,0);
});

test('highlights exposes repeatable native trim segments', () => {
 const { videoHighlightsProperties } = require('../dist/nodes/PicsartVideo/properties/videoHighlightsProperties.js');
 assert.equal(videoHighlightsProperties.find(p => p.name === 'trimSegments').typeOptions.multipleValues, true);
});

test('compression sends target size inside export per API contract', async () => {
 const c=context([{url:'https://example.com/output.mp4'}]); const out=[];
 await executeCompressVideo(c,0,out);
 assert.equal(c.calls[0].options.body.export.max_size_mb,8);
 assert.equal(Object.hasOwn(c.calls[0].options.body,'max_size_mb'),false);
 assert.equal(out[0].json.max_size_mb,8);
});

for(const value of [0.15,0,-1,NaN,Infinity,'2']) test('compression rejects invalid size '+String(value),async()=>{
 const c=context([]),get=c.getNodeParameter;c.getNodeParameter=(k,i,d)=>k==='max_size_mb'?value:get(k,i,d);
 await assert.rejects(executeCompressVideo(c,0,[]),/positive whole number/);assert.equal(c.calls.length,0);
});

for (const [name,execute] of videoExecutors.filter(([n])=>['trim','Crop','compression','VideoHighlights','VideoEffects'].includes(n))) {
 for (const [format,mime] of [['MP4','video/mp4'],['MOV','video/quicktime'],['WEBM','video/webm'],...(['VideoHighlights','VideoEffects'].includes(name)?[['GIF','image/gif']]:[])]) {
  for (const polled of [false,true]) test(name+' export metadata '+format+' polled='+polled,async t=>{
   t.mock.method(polling,'waitBeforeVideoPoll',async()=>{});
   const c=context(polled?[{transaction_id:'job'},{status:'success',data:{url:'https://example.com/output'}}]:[{url:'https://example.com/output'}]);
   const get=c.getNodeParameter;c.getNodeParameter=(k,i,d)=>k==='mode'?'advanced':['format','exportFormat','cropExportFormat'].includes(k)?format:get(k,i,d);
   const prepared=[];c.helpers.prepareBinaryData=async (data,fileName,mimeType)=>{prepared.push({fileName,mimeType});return {data:'test',fileName,mimeType};};
   await execute(c,0,[]);assert.equal(prepared.length,1);assert.equal(prepared[0].mimeType,mime);assert(prepared[0].fileName.endsWith('.'+format.toLowerCase()));
  });
 }
}

test('trim sends format inside export per API contract',async()=>{
 const c=context([{url:'https://example.com/result.mov'}]);const get=c.getNodeParameter;c.getNodeParameter=(k,i,d)=>k==='mode'?'advanced':k==='cropExportFormat'?'MOV':get(k,i,d);await executeTrim(c,0,[]);assert.deepEqual(c.calls[0].options.body.export,{format:'MOV'});assert.equal(Object.hasOwn(c.calls[0].options.body,'format'),false);
});

test('effects maps existing single selection to effects array and export format',async()=>{
 const c=context([{url:'https://example.com/result.mov'}]);const get=c.getNodeParameter;c.getNodeParameter=(k,i,d)=>k==='effectName'?'mnch1':k==='format'?'MOV':get(k,i,d);const output=[];await require('../dist/nodes/PicsartVideo/execute/executeVideoEffects').executeVideoEffects(c,0,output);assert.deepEqual(c.calls[0].options.body,{video_url:'https://example.com/test.mp4',effects:['mnch1'],export:{format:'MOV'}});assert.equal(output.length,1);
});

for(const [key,value] of [['fitWidth',15],['fitHeight',15],['fitWidth',NaN],['fitHeight',Infinity],['fitRatio',NaN],['fitRatio','1'],['fitBgBlur',0.5],['fitBgBlur',NaN]]) test('fit rejects invalid '+key+' '+String(value)+' before HTTP',async()=>{
 const c=context([]),get=c.getNodeParameter;c.getNodeParameter=(k,i,d)=>k===key?value:k==='mode'?'advanced':get(k,i,d);
 await assert.rejects(require('../dist/nodes/PicsartVideo/execute/executeFit').executeFit(c,0,[]),/Width|Height|Ratio|Background blur/);assert.equal(c.calls.length,0);
});
test('fit accepts documented 16px boundary and maps values unchanged',async()=>{
 const c=context([{url:'https://example.com/result.mp4'}]),get=c.getNodeParameter;c.getNodeParameter=(k,i,d)=>k==='mode'?'advanced':['fitWidth','fitHeight'].includes(k)?16:get(k,i,d);
 await require('../dist/nodes/PicsartVideo/execute/executeFit').executeFit(c,0,[]);assert.equal(c.calls[0].options.body.width,16);assert.equal(c.calls[0].options.body.height,16);
});

for(const anchor of ['left-top','right-bottom','pattern']) test('watermark serializes documented anchor '+anchor,async()=>{
 const c=context([{url:'https://example.com/result.mp4'}]);const get=c.getNodeParameter;c.getNodeParameter=(k,i,d)=>k==='anchorPoint'?anchor:get(k,i,d);
 await require('../dist/nodes/PicsartVideo/execute/executeWatermart').executeWatermark(c,0,[]);
 const body=Buffer.from(c.calls[0].options.body).toString();
 assert(body.includes('name="watermark_anchor_point"\r\n\r\n'+anchor));assert(!body.includes('name="anchor_point"'));
});

test('effects choices match independently captured current API contract',()=>{
 const contract=require('./fixtures/video-effects-contract.json');const {videoEffectsProperties}=require('../dist/nodes/PicsartVideo/properties/videoEffectsProperties');
 const values=videoEffectsProperties.find(p=>p.name==='effectName').options.map(o=>o.value);assert.equal(new Set(values).size,values.length);assert.deepEqual([...values].sort(),[...contract.effects].sort());
 assert.deepEqual(videoEffectsProperties.find(p=>p.name==='format').options.map(o=>o.value).sort(),[...contract.formats].sort());
});

for(const [label,code] of Object.entries({'Focal Zoom':'focalzoom','Lens Blur':'lensblur','Motion Blur':'motionblur','Radial Blur':'radialblur','Smart Blur':'smartblur','Blur':'gblur','Black And White':'bw'})) test('effects maps documented label '+label+' to live API code',async()=>{
 const c=context([{url:'https://example.com/result.mp4'}]),get=c.getNodeParameter;c.getNodeParameter=(k,i,d)=>k==='effectName'?label:get(k,i,d);
 await require('../dist/nodes/PicsartVideo/execute/executeVideoEffects').executeVideoEffects(c,0,[]);assert.deepEqual(c.calls[0].options.body.effects,[code]);
});
