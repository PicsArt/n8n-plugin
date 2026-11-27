const {test}=require('node:test');
const a=require('node:assert/strict');
for(const [format,cap] of [['JPG','Jpg'],['WEBP','Webp']]) {
 const execute=require(`../dist/nodes/PicsartImage/execute/executeConvertPngTo${cap}`)[`executeConvertPngTo${cap}`];
 function context(params){
  const calls=[];
  return {calls,getNode:()=>({name:'PNG conversion',typeVersion:1}),getNodeParameter:(key,i,fallback)=>Object.hasOwn(params,key)?params[key]:fallback,
   helpers:{assertBinaryData:()=>({mimeType:'image/png',fileName:'source.png'}),getBinaryDataBuffer:async()=>Buffer.from('png-fixture'),
    httpRequestWithAuthentication:async function(credential,request){calls.push({credential,request});return {data:{url:'https://example.com/output'}};},
    httpRequest:async request=>{calls.push({download:request});return Buffer.from('converted-fixture');},
    prepareBinaryData:async(bytes,fileName)=>({data:bytes.toString('base64'),fileName})}};
 }
 for(const resource of ['DATA','Image URL']) for(const authentication of ['apiKey','oAuth2']) {
  test(`${format} ${resource} ${authentication}: quality boundaries and legacy default reach multipart request`,async()=>{
   for(const quality of [undefined,10,75,100]) {
    const c=context({resource,authentication,inputBinaryField:'data',image_url:'https://example.com/source.png',...(quality===undefined?{}:{quality})});const out=[];
    await execute(c,0,out);
    a.equal(c.calls[0].credential,authentication==='apiKey'?'picsartApi':'picsartOAuth2Api');
    const body=c.calls[0].request.body.toString();
    a.match(body,new RegExp(`name="quality"\\r\\n\\r\\n${quality??90}\\r\\n`));
    a.match(body,new RegExp(`name="format"\\r\\n\\r\\n${format}\\r\\n`));
    a.match(body,resource==='DATA'?/name="image"; filename="source.png"/:/name="image_url"/);
    a.equal(c.calls.length,2);a.equal(out[0].json.format,format);a.equal(out[0].binary.data.fileName,`converted-image.${format.toLowerCase()}`);
   }
  });
 }
 test(`${format}: malformed quality stops before upload, processing or download`,async()=>{
  for(const quality of [9,101,10.5,NaN,Infinity,null,'75','',true,{},[]]) {
   const c=context({resource:'Image URL',image_url:'https://example.com/source.png',quality});
   await a.rejects(execute(c,0,[]),/Quality must be an integer from 10 to 100/);a.equal(c.calls.length,0);
  }
 });
 test(`${format}: quality field is available for both input modes`,()=>{
  const props=require(`../dist/nodes/PicsartImage/properties/convertPngTo${cap}Properties`)[`convertPngTo${cap}Properties`];
  const p=props.find(p=>p.name==='quality');a.equal(p.default,90);a.deepEqual(p.displayOptions.show,{operation:[`Convert PNG to ${format}`]});
 });
}
