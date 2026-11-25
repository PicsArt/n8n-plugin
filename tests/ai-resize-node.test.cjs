const {test}=require('node:test'),a=require('node:assert/strict');
const {PicsartAiResize}=require('../dist/nodes/PicsartAiResize/PicsartAiResize.node.js');
const {catalogOptions,pngDimensions}=require('../dist/nodes/PicsartAiResize/helpers.js');
const node=new PicsartAiResize();
const basic={operation:'resize_image_with_ai',source_image:'https://example.com/source.png',model:'urn:air:sdxl:model:fluxai:flux_kontext_max@1',target_size:'300x250'};
const accepted=id=>({status:'success',response:{id}});
function ctx(input,responses=[],binary,keep=false){const calls=[],downloads=[];return {calls,downloads,getInputData:()=>[{json:{}}],getNodeParameter:(k,i,f)=>input[k]??f,getNode:()=>({name:'AI Resize',type:'picsartAiResize',typeVersion:1,parameters:{}}),continueOnFail:()=>keep,helpers:{httpRequestWithAuthentication:async(credential,options)=>{calls.push({credential,options});const r=responses.shift();if(r instanceof Error)throw r;if(!r)throw Error('Unexpected network call');return r;},httpRequest:async options=>{downloads.push(options);return binary;}}};}
test('single size submits exactly one image with current task ID and no alias',async()=>{
 const c=ctx(basic,[accepted('job-1')]);const out=await node.execute.call(c);a.equal(c.calls.length,1);a.equal(c.calls[0].credential,'picsartOAuth2Api');a.equal(c.calls[0].options.body.params.count,1);a.equal(c.calls[0].options.body.params.width,300);a.equal(c.calls[0].options.body.params.height,250);a.equal(out[0][0].json.task_id,'job-1');a.equal(out[0][0].json.completed,false);
});
test('invalid later target prevents all submissions',async()=>{
 const c=ctx({...basic,operation:'create_ai_image_size_variants',target_sizes:['300x250','300x50']});await a.rejects(node.execute.call(c),/64 to 4096/);a.equal(c.calls.length,0);
});
test('variants retain every accepted task and stop on ambiguous submission without retry',async()=>{
 const c=ctx({...basic,operation:'create_ai_image_size_variants',target_sizes:['300x250','728x90','160x600']},[accepted('saved-1'),Error('timeout')],null,true);const r=await node.execute.call(c);a.equal(c.calls.length,2);a.equal(r[0][0].json.accepted_tasks[0].task_id,'saved-1');a.match(r[0][0].json.error,/Do not resubmit/);a.equal(r[0][0].json.automatic_resubmission_allowed,false);
});
test('error mode retains accepted tasks in error details',async()=>{
 const c=ctx({...basic,operation:'create_ai_image_size_variants',target_sizes:['300x250','728x90']},[accepted('saved-1'),{}]);await a.rejects(node.execute.call(c),/saved-1/);a.equal(c.calls.length,2);
});
for(const patch of [{source_image:'http://example.com/a'},{source_image:'https://user:pass@example.com/a'},{model:'flux-kontext-max'},{target_size:'300x50'},{target_size:'custom',width:300.5,height:250},{operation:'create_ai_image_size_variants',target_sizes:[]},{operation:'create_ai_image_size_variants',target_sizes:['300x250','300x250']}])test('invalid configuration stops before API: '+JSON.stringify(patch),async()=>{const c=ctx({...basic,...patch});await a.rejects(node.execute.call(c));a.equal(c.calls.length,0);});
const retrieval={operation:'get_ai_resize_result',task_id:'existing/job',requested_width:300,requested_height:250};
test('pending retrieval retains ID and ignores stale output',async()=>{const c=ctx(retrieval,[{status:'success',response:{id:retrieval.task_id,status:'IN_PROGRESS',result:{data:[{url:'https://example.com/stale.png'}]}}}]);const r=await node.execute.call(c);a.equal(c.calls[0].options.method,'GET');a.match(c.calls[0].options.url,/existing%2Fjob\/result$/);a.equal(r[0][0].json.completed,false);a.equal(c.downloads.length,0);});
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,b){const out=Buffer.alloc(b.length+12);out.writeUInt32BE(b.length);out.write(type,4);b.copy(out,8);out.writeUInt32BE(crc(out.subarray(4,-4)),out.length-4);return out;}
function png(w,h){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=2;const pixels=Buffer.alloc((w*3+1)*h);return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',require('node:zlib').deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);}
test('mismatched result dimensions are preserved for review, never resized',async()=>{const c=ctx(retrieval,[{status:'success',response:{id:retrieval.task_id,status:'COMPLETED',result:{data:[{url:'https://example.com/result.png'}]}}}],png(1024,1024));const r=await node.execute.call(c);a.equal(r[0][0].json.size_match,false);a.equal(r[0][0].json.actual_width,1024);a.equal(r[0][0].json.review_required,true);a.equal(c.downloads[0].headers,undefined);a.equal(c.downloads[0].disableFollowRedirect,true);a.equal(c.calls.length,1);});
test('HTML or truncated results fail without regeneration',()=>{for(const b of [Buffer.from('<html>error</html>'),png(300,250).subarray(0,24),png(0,0)])a.throws(()=>pngDimensions(b));});
test('live catalog shape provides 44 exact model choices',()=>{const r={body:require('./fixtures/ai-resize-models.json')};a.equal(catalogOptions(r.body).length,44);a.deepEqual(catalogOptions(r.body).map(x=>x.value),r.body.response.result.map(x=>x.model));});

test('dimension-only, corrupt and truncated PNGs never report size success',()=>{const valid=png(300,250);const corrupt=Buffer.from(valid);corrupt[20]^=1;for(const data of [valid.subarray(0,33),valid.subarray(0,-1),corrupt,Buffer.concat([valid,Buffer.from('trailing')])])a.throws(()=>pngDimensions(data));a.deepEqual(pngDimensions(valid),{width:300,height:250});});

test('result identity rejects missing or unrelated tasks before media download',async()=>{for(const id of [undefined,null,'other-job',' existing/job']){const c=ctx(retrieval,[{status:'success',response:{id,status:'COMPLETED',result:{data:[{url:'https://example.com/result.png'}]}}}]);await a.rejects(node.execute.call(c),/does not match/);a.equal(c.calls.length,1);a.equal(c.downloads.length,0);}});
