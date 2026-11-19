const {test}=require('node:test');
const assert=require('node:assert/strict');
const {NodeApiError}=require('n8n-workflow');
const {handleApiError}=require('../dist/nodes/PicsartVideo/execute/errorHandler');
const node={id:'test',name:'Video',type:'test',typeVersion:1,position:[0,0],parameters:{}};
for(const [status,expected] of [[401,/Authentication or authorization/],[403,/Authentication or authorization/],[429,/credits or rate limit/],[503,/server error/]])test('wrapped HTTP '+status+' preserves classification and accepted transaction',()=>{
 const error=new NodeApiError(node,{message:'Provider rejected the result read',statusCode:status},{itemIndex:2});
 assert.throws(()=>handleApiError({getNode:()=>node},error,2,'saved-transaction'),caught=>{
  assert.match(caught.message,expected);assert.match(caught.message,/saved-transaction/);assert.match(caught.message,/Retrieve this existing transaction/);return true;
 });
});
