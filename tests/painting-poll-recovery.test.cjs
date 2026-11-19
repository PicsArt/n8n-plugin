const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NodeApiError, NodeOperationError } = require('n8n-workflow');
const delay = require('../dist/nodes/PicsartGeneration/execute/pollDelay');
const { pollUntilPaintingImagesReady: poll, paintingInferenceUrl } = require('../dist/nodes/PicsartGeneration/execute/pollPaintingInference');
const node = { id: 'test', name: 'Painting', type: 'test', typeVersion: 1, position: [0, 0], parameters: {} };
function context(queue) {
 return { getNode: () => node, getNodeParameter: () => 'oAuth2', helpers: {
  httpRequestWithAuthentication: async (credential, options) => {
   assert.equal(credential, 'picsartOAuth2Api'); assert.equal(options.method, 'GET');
   const result = queue.shift() ?? { status: 'processing' };
   if (result instanceof Error) throw result;
   return result;
  }
 }};
}
test('painting waits after pending and 404, returns bounded images without resubmission', async t => {
 const attempts = []; t.mock.method(delay, 'waitBeforeGenerationPoll', async n => attempts.push(n));
 const result = await poll(context([{status:'processing'}, Object.assign(Error('not ready'), {statusCode:404}), {status:'completed',data:[{url:'https://example.com/1'},{url:'https://example.com/2'}]}]), 'saved-job', 1, 0);
 assert.deepEqual(attempts, [0,1,2]); assert.deepEqual(result.imageUrls, ['https://example.com/1']);
});
test('painting auth failure retains native HTTP classification and saved task', async t => {
 t.mock.method(delay, 'waitBeforeGenerationPoll', async () => {});
 await assert.rejects(poll(context([Object.assign(Error('denied'),{statusCode:401})]),'saved-job',1,0), e => e instanceof NodeApiError && e.httpCode === '401' && /saved-job.*do not resubmit/.test(e.message));
});
test('painting terminal failure and exhaustion retain task with bounded reads', async t => {
 let count = 0; t.mock.method(delay, 'waitBeforeGenerationPoll', async () => count++);
 await assert.rejects(poll(context([]),'saved-job',1,0), /600 polling attempts.*saved-job.*do not resubmit/);
 assert.equal(count, 600);
 await assert.rejects(poll(context([{status:'failed',message:'Rejected'}]),'saved-job',1,0), e => e instanceof NodeOperationError && /Rejected.*saved-job.*do not resubmit/.test(e.message));
});
test('painting task URL encodes opaque IDs', () => assert.match(paintingInferenceUrl('a/b?c'), /a%2Fb%3Fc$/));
