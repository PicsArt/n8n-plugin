const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {createRequire}=require('node:module');
const root=path.dirname(require.resolve('n8n-workflow'));
const hostRequire=createRequire(require.resolve('n8n-workflow'));
const schemas=require(path.join(root,'schemas.js'));
const events=require(path.join(root,'message-event-bus.js'));
const ai=require(path.join(root,'from-ai-parse-utils.js'));
test('Zod 4 migration preserves resource mapper record values and rejects invalid values',()=>{
 const value={mappingMode:'defineBelow',value:{name:'mug',count:2,enabled:true,empty:null},matchingColumns:[],schema:[],attemptToConvertTypes:false,convertFieldsToString:false};
 assert.deepEqual(schemas.ResourceMapperValueSchema.parse(value),value);
 assert.equal(schemas.ResourceMapperValueSchema.safeParse({...value,value:{invalid:[]}}).success,false);
});
test('Zod 4 migration preserves post-receive record and webhook credential validation',()=>{
 const action={type:'setKeyValue',properties:{name:'result',count:2}};
 assert.deepEqual(schemas.IPostReceiveSetKeyValueSchema.parse(action),action);
 assert.equal(schemas.IPostReceiveSetKeyValueSchema.safeParse({...action,properties:{bad:false}}).success,false);
 const credentials={oauth:{id:'test-only'},enabled:true};
 assert.deepEqual(events.MessageEventBusDestinationOptionsSchema.parse({credentials}).credentials,credentials);
});
test('workflow node parameter and generated input schemas work with patched Zod',()=>{
 const node={id:'1',name:'Picsart',type:'picsart',typeVersion:1,position:[0,0],parameters:{prompt:'test',options:{quality:1},enabled:true}};
 assert.deepEqual(schemas.INodeSchema.parse(node),node);
 assert.equal(schemas.INodeSchema.safeParse({...node,position:['bad',0]}).success,false);
 assert.equal(ai.generateZodSchema({key:'count',type:'number',defaultValue:2}).parse(undefined),2);
 assert.equal(ai.generateZodSchema({key:'count',type:'number'}).safeParse('bad').success,false);
});
test('patched uuid supports host v4 and rejects undersized v5 output buffers',()=>{
 const uuid=hostRequire('uuid');assert.equal(uuid.validate(uuid.v4()),true);
 assert.throws(()=>uuid.v5('x',uuid.v5.DNS,new Uint8Array(8),4),RangeError);
});
test('patched minimatch preserves TypeScript tooling glob and negation behavior',()=>{
 const parserRequire=createRequire(require.resolve('@typescript-eslint/parser'));
 const estreeRequire=createRequire(parserRequire.resolve('@typescript-eslint/typescript-estree'));
 const {minimatch}=estreeRequire('minimatch');
 assert.equal(minimatch('nodes/PicsartVideo/example.ts','nodes/**/*.ts'),true);
 assert.equal(minimatch('nodes/PicsartVideo/example.js','nodes/**/*.ts'),false);
 assert.equal(minimatch('node_modules/x.ts','!node_modules/**'),false);
});
