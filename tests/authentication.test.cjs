const { test } = require('node:test');
const assert = require('node:assert/strict');
const { picsartCredentialType } = require('../dist/nodes/authentication');
const { executeExtractColors } = require('../dist/nodes/ExtractImageColors/execute/executeExtractColors');
const { executeText2Speech } = require('../dist/nodes/PicsartGeneration/execute/executeText2Speech');
const { executeFpsUpscale } = require('../dist/nodes/PicsartVideo/execute/executeFpsUpscale');

function context(authentication, responses) {
  const calls = [], downloads = [];
  const params = { authentication, resource: 'Image URL', image_url: 'https://example.com/input.png',
    videoUrl: 'https://example.com/input.mp4', text2SpeechText: 'Hello', text2SpeechModel: 'test-model' };
  return { calls, downloads,
    getNodeParameter: (name, _index, fallback) => params[name] ?? fallback,
    getNode: () => ({ name: 'Test', type: 'test', typeVersion: 1, parameters: {} }),
    helpers: {
      httpRequestWithAuthentication: async (credential, options) => {
        calls.push({ credential, options });
        const response = responses.shift();
        if (response instanceof Error) throw response;
        assert.ok(response, 'unexpected authenticated request');
        return response;
      },
      httpRequest: async (options) => { downloads.push(options); return Buffer.from('media'); },
      prepareBinaryData: async () => ({ data: 'bWVkaWE=', mimeType: 'application/octet-stream' }),
    },
  };
}

for (const auth of [undefined, 'apiKey', 'oAuth2']) {
  const expected = auth === 'oAuth2' ? 'picsartOAuth2Api' : 'picsartApi';
  test(`tools endpoint preserves selected credential: ${auth}`, async () => {
    const ctx = context(auth, [{ data: { colors: ['#fff'] } }]);
    const output = [];
    await executeExtractColors(ctx, 0, output);
    assert.equal(ctx.calls[0].credential, expected);
    assert.equal(new URL(ctx.calls[0].options.url).hostname, 'api.picsart.io');
    assert.deepEqual(output[0].json.colors, ['#fff']);
  });
  for (const [name, execute, host] of [
    ['speech', executeText2Speech, 'genai-api.picsart.io'],
    ['video', executeFpsUpscale, 'video-api.picsart.io'],
  ]) {
    test(`${name} submit and poll use ${expected}; CDN download stays unauthenticated`, async () => {
      const ctx = context(auth, [{ inference_id: 'job1' }, { status: 'completed', data: { url: 'https://cdn.example.com/result' } }]);
      const output = [];
      await execute(ctx, 0, output);
      assert.equal(ctx.calls.length, 2);
      for (const call of ctx.calls) {
        assert.equal(call.credential, expected);
        assert.equal(new URL(call.options.url).hostname, host);
        assert.equal(call.options.headers.Authorization, undefined);
        assert.equal(call.options.headers['x-picsart-api-key'], undefined);
      }
      assert.equal(ctx.downloads.length, 1);
      assert.equal(ctx.downloads[0].headers, undefined);
      assert.ok(output[0].binary.data);
    });
  }
}

test('unknown authentication fails closed', () => {
  assert.throws(() => picsartCredentialType(context('unsupported', [])), /Unsupported/);
});

test('OAuth authorization failures propagate and do not retry with an API key', async () => {
  const error = Object.assign(new Error('Missing scope'), { statusCode: 403 });
  const ctx = context('oAuth2', [error]);
  await assert.rejects(executeExtractColors(ctx, 0, []), /selected Picsart connection/);
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.calls[0].credential, 'picsartOAuth2Api');
  assert.equal(ctx.downloads.length, 0);
});

test('legacy nodes preserve API-key defaults; new audio node requires OAuth', () => {
  const manifest = require('../package.json');
  for (const file of manifest.n8n.nodes) {
    const Node = Object.values(require('../' + file))[0];
    const node = new Node();
    if (node.description.name === 'picsartAudio') {
      assert.deepEqual(node.description.credentials, [{ name: 'picsartOAuth2Api', required: true }]);
      assert.equal(node.description.properties.some(p => p.name === 'authentication'), false);
      continue;
    }
    assert.equal(node.description.properties.find(p => p.name === 'authentication').default, 'apiKey');
    assert.deepEqual(node.description.credentials.map(c => c.name), ['picsartApi', 'picsartOAuth2Api']);
    const { NodeHelpers } = require('n8n-workflow');
    const savedNode = { name: 'Existing workflow node', type: node.description.name, typeVersion: 1, parameters: {} };
    const resolved = NodeHelpers.getNodeParameters(node.description.properties, {}, true, false, savedNode);
    assert.equal(resolved.authentication, 'apiKey');
    assert.equal(NodeHelpers.displayParameter(resolved, node.description.credentials[0], savedNode), true);
    assert.equal(NodeHelpers.displayParameter(resolved, node.description.credentials[1], savedNode), false);
  }
});

test('OAuth delegates to core with DCR/PKCE; API key contract remains intact', () => {
  const { PicsartOAuth2Api } = require('../dist/credentials/PicsartOAuth2Api.credentials');
  const oauth = new PicsartOAuth2Api();
  assert.deepEqual(oauth.extends, ['oAuth2Api']);
  const properties = Object.fromEntries(oauth.properties.map(p => [p.name, p.default]));
  assert.equal(properties.useDynamicClientRegistration, true);
  assert.equal(properties.grantType, 'pkce');
  assert.equal(properties.serverUrl, 'https://auth.picsart.com/api');
  const { PicsartApi } = require('../dist/credentials/PicsartApi.credentials');
  assert.equal(new PicsartApi().authenticate.properties.headers['x-picsart-api-key'], '={{$credentials.apiKey}}');
});
