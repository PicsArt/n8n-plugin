const {test}=require('node:test');
const assert=require('node:assert/strict');
const {NodeOperationError}=require('n8n-workflow');
const cases=[
 ['PicsartGeneration','text2Image','executeText2Image'],
 ['PicsartImage','INVALID',null],
 ['PicsartVideo','INVALID',null],
 ['ExtractImageColors',null,'executeExtractColors'],
];
for(const [name,operation,executor] of cases){
 test(name+' preserves validation error and continue-on-fail item mapping',async t=>{
  const Node=require(`../dist/nodes/${name}/${name}.node`)[name];
  const node={id:'test',name,type:'test',typeVersion:1,position:[0,0],parameters:{}};
  const original=new NodeOperationError(node,'Validation requires a supported input',{itemIndex:0,description:'Preserve this detail'});
  if(executor){const mod=require(`../dist/nodes/${name}/execute/${executor}`);t.mock.method(mod,executor,async()=>{throw original;});}
  let continueOnFail=false;
  const ctx={getNode:()=>node,getInputData:()=>[{json:{source:'kept'}}],getNodeParameter:()=>operation,continueOnFail:()=>continueOnFail};
  await assert.rejects(Node.prototype.execute.call(ctx),e=>executor?e===original:e instanceof NodeOperationError&&/not supported/.test(e.message));
  continueOnFail=true;
  const [[result]]=await Node.prototype.execute.call(ctx);
  assert.deepEqual(result.json,{source:'kept'});assert.equal(result.pairedItem,0);
  assert.ok(result.error instanceof NodeOperationError);
  if(executor){assert.equal(result.error,original);assert.equal(result.error.description,'Preserve this detail');}
 });
}
