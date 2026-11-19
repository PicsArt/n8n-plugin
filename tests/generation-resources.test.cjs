const {test}=require('node:test');const assert=require('node:assert/strict');
const {NodeHelpers}=require('n8n-workflow');
const {PicsartGeneration}=require('../dist/nodes/PicsartGeneration/PicsartGeneration.node');
const description=new PicsartGeneration().description;
const groups={image:['Edit Image with Prompt','text2Image','text2Sticker'],audio:['Generate Music/Sound from Prompt','Generate Speech from Prompt'],video:['Generate Video from Prompt','Generate Video from Prompt and Image']};
const fields={'Edit Image with Prompt':'paintingEditPrompt',text2Image:'prompt',text2Sticker:'prompt','Generate Music/Sound from Prompt':'text2SoundPrompt','Generate Speech from Prompt':'text2SpeechText','Generate Video from Prompt':'text2VideoPrompt','Generate Video from Prompt and Image':'image2VideoPrompt'};
function visible(values,version){return description.properties.filter(p=>NodeHelpers.displayParameter(values,p,{typeVersion:version},description));}
for(const [resource,operations] of Object.entries(groups)){
 for(const operation of operations)test('legacy workflow retains '+operation,()=>{
  const properties=visible({operation},1);assert.equal(properties.filter(p=>p.name==='operation').length,1);assert.equal(properties.some(p=>p.name==='resource'),false);
  const params=NodeHelpers.getNodeParameters(description.properties,{operation,[fields[operation]]:'Keep this prompt'},true,false,{typeVersion:1},description);
  assert.equal(params.operation,operation);assert.equal(params[fields[operation]],'Keep this prompt');
 });
 test('v2 '+resource+' shows only its operations and preserves inputs',()=>{
  for(const operation of operations){
   const properties=visible({resource,operation},2);const selector=properties.filter(p=>p.name==='operation');assert.equal(selector.length,1);assert.deepEqual(selector[0].options.map(o=>o.value),operations);
   const params=NodeHelpers.getNodeParameters(description.properties,{resource,operation,[fields[operation]]:'Keep this prompt'},true,false,{typeVersion:2},description);
   assert.equal(params.operation,operation);assert.equal(params.resource,resource);assert.equal(params[fields[operation]],'Keep this prompt');
  }
 });
}
