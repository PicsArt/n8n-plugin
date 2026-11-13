const { test } = require('node:test');
const assert = require('node:assert/strict');
const { capturedModelIds } = require('../dist/nodes/PicsartGeneration/modelOptions');
const { PicsartGeneration } = require('../dist/nodes/PicsartGeneration/PicsartGeneration.node');
const properties = new PicsartGeneration().description.properties;
test('image-to-video defaults to an existing image-conditioned model, preserving old explicit choices', () => {
  const property = properties.find(p => p.name === 'image2VideoModel');
  assert.equal(property.default, 'urn:air:google:model:google:veo-3.1-fast-image-to-video@1');
  assert.ok(property.options.some(option => option.value === property.default));
  assert.ok(property.options.some(option => option.value === 'urn:air:google:model:google:veo-3.1-fast-text-to-video@1'));
});
const cases = [
  ['genai-text2image', 'text2Image', 'model', {prompt:'Product', width:512, height:512, count:1}],
  ['genai-text2sticker', 'text2Sticker', 'model', {prompt:'Sticker', width:512, height:512, count:1}],
  ['genai-text2speech', 'text2Speech', 'text2SpeechModel', {text2SpeechText:'Hello', text2SpeechLanguage:'en'}],
  ['genai-text2sound', 'text2Sound', 'text2SoundModel', {text2SoundPrompt:'Rain', text2SoundDuration:2, text2SoundLoop:false}],
];
for (const [operation, stem, parameter, params] of cases) {
  test(`${operation}: all captured models appear and reach the exact request unchanged`, async () => {
    const property = properties.find(p => p.name === parameter && (parameter !== 'model' || p.displayOptions.show.operation.includes(stem)));
    assert.ok(property, parameter);
    const available = property.options.map(o => o.value);
    for (const model of capturedModelIds[operation]) assert.ok(available.includes(model));
    assert.ok(available.includes(property.default), 'existing default preserved');
    const exportName = 'execute'+stem[0].toUpperCase()+stem.slice(1);
    const execute = require('../dist/nodes/PicsartGeneration/execute/'+exportName)[exportName];
    for (const model of capturedModelIds[operation]) {
      const calls = [];
      const ctx = {
        getNodeParameter:(name, index, fallback) => ({...params,[parameter]:model})[name] ?? fallback,
        getNode:()=>({name:'Test',type:'test',typeVersion:1,parameters:{}}),
        helpers:{
          httpRequestWithAuthentication:async (credential, options)=>{
            calls.push(options);
            return calls.length===1 ? {inference_id:'test-job'} : {status:'completed',data:[{url:'https://example.com/media'}]};
          },
          httpRequest:async()=>Buffer.from('media'),
          prepareBinaryData:async()=>({data:'bWVkaWE=',mimeType:'application/octet-stream'}),
        },
      };
      await execute(ctx,0,[]);
      assert.equal(calls[0].url,'https://genai-api.picsart.io/v1/'+operation.replace('genai-',''));
      assert.equal(calls[0].body.model,model);
      assert.equal(calls[0].headers['Content-Type'],'application/json');
      if(stem==='text2Speech') assert.equal(calls[0].body.text,'Hello');
      if(stem==='text2Sound') assert.equal(calls[0].body.duration,2);
    }
  });
}
