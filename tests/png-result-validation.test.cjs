const {test}=require('node:test');const a=require('node:assert/strict');
for(const cap of ['Jpg','Webp']) {
 const execute=require(`../dist/nodes/PicsartImage/execute/executeConvertPngTo${cap}`)[`executeConvertPngTo${cap}`];
 function setup(result,bytes=Buffer.from('image')) {
  const calls=[];const ctx={getNode:()=>({name:'Convert',typeVersion:1}),getNodeParameter:(k,i,d)=>({resource:'Image URL',image_url:'https://example.com/source.png'}[k]??d),helpers:{
   httpRequestWithAuthentication:async()=>{calls.push('submit');return result;},
   httpRequest:async(options)=>{calls.push(options);return bytes;},
   prepareBinaryData:async()=>{calls.push('binary');return {data:'fixture'};}
  }};return {ctx,calls};
 }
 test(`${cap} rejects malformed results before any download`,async()=>{
  for(const result of [null,{}, {data:{}},...['',null,42,{},[],'relative/path','http://example.com/result','file:///tmp/result','https://user:pass@example.com/result',' https://example.com/result'].map(url=>({data:{url}}))]){
   const {ctx,calls}=setup(result);const out=[];await a.rejects(execute(ctx,0,out),/output.*URL|output must be/i);a.deepEqual(calls,['submit']);a.deepEqual(out,[]);
  }
 });
 test(`${cap} preserves signed result URL and uses unauthenticated binary download`,async()=>{
  const url='https://example.com/result?signature=abc%2Bdef&expires=123';const {ctx,calls}=setup({data:{url}});const out=[];await execute(ctx,0,out);
  a.deepEqual(calls[1],{method:'GET',url,encoding:'arraybuffer'});a.equal(out.length,1);a.equal(out[0].json.result.data.url,url);
 });
 test(`${cap} never returns success for empty download`,async()=>{
  const {ctx,calls}=setup({data:{url:'https://example.com/result'}},Buffer.alloc(0));const out=[];await a.rejects(execute(ctx,0,out),/download is empty/);a.equal(calls.length,2);a.deepEqual(out,[]);
 });
 test(`${cap} rejects unknown resource before submission`,async()=>{
  const {ctx,calls}=setup({});ctx.getNodeParameter=()=> 'unknown';await a.rejects(execute(ctx,0,[]),/input resource/);a.deepEqual(calls,[]);
 });
}
