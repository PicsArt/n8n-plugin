const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildMultipartFormData}=require('../dist/nodes/PicsartVideo/execute/utils');
for(const field of ['filename','contentType']) test('multipart rejects header injection via '+field,()=>{
 const value={data:Buffer.from([0,1,255]),filename:'logo.png',contentType:'image/png',[field]:'image/png\r\nX-Injected: yes'};
 assert.throws(()=>buildMultipartFormData({watermark:value}),/control characters/);
});
test('multipart rejects control characters in field names',()=>{
 assert.throws(()=>buildMultipartFormData({'watermark\r\nX-Injected: yes':'x'}),/control characters/);
});
test('multipart quotes filename safely and preserves binary payload',()=>{
 const data=Buffer.from([0,13,10,255,128]);
 const result=buildMultipartFormData({watermark:{data,filename:'logo".png',contentType:'image/png'},caption:'line1\r\nline2'});
 const body=Buffer.from(result.body);assert(body.includes(data));assert(body.toString().includes('filename="logo%22.png"'));assert(body.toString().includes('line1\r\nline2'));
 const boundary=result.contentType.split('boundary=')[1];assert(body.toString().endsWith('--'+boundary+'--\r\n'));
});
