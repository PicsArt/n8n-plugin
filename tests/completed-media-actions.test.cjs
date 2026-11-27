const { test } = require('node:test');
const a = require('node:assert/strict');
const delays = require('../dist/nodes/PicsartGeneration/execute/pollDelay');
const videoDelays = require('../dist/nodes/PicsartVideo/execute/polling');
const { waitForAudioResult } = require('../dist/nodes/PicsartAudio/PicsartAudio.node');
const { executeConcat } = require('../dist/nodes/PicsartVideo/execute/executeConcat');
function context(responses) {
	const calls = [];
	return {
		calls,
		getNode: () => ({ name: 'test', type: 'test', typeVersion: 1, parameters: {} }),
		getNodeParameter: (k) =>
			k === 'authentication' ? 'oAuth2' : 'https://example.com/a.mp4\nhttps://example.com/b.mp4',
		helpers: {
			httpRequestWithAuthentication: async (c, o) => {
				calls.push(o);
				const r = responses.shift();
				if (r instanceof Error) throw r;
				if (!r) throw Error('Unexpected request');
				return r;
			},
		},
	};
}
test('audio waits through pending states, ignores stale URL, and returns only completed media', async (t) => {
	const attempts = [];
	t.mock.method(delays, 'waitBeforeGenerationPoll', async (n) => attempts.push(n));
	const response = (status) => ({
		status: 'success',
		response: { id: 'saved', status, result: { url: 'https://example.com/' + status + '.wav' } },
	});
	const c = context(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map(response));
	const out = await waitForAudioResult(c, 'saved');
	a.equal(out.url, 'https://example.com/COMPLETED.wav');
	a.deepEqual(attempts, [0, 1, 2]);
	a.ok(c.calls.every((c) => c.method === 'GET'));
});
test('audio polling stops at limit without emitting a task receipt as success', async (t) => {
	t.mock.method(delays, 'waitBeforeGenerationPoll', async () => {});
	const c = context(
		Array(3).fill({ status: 'success', response: { id: 'saved', status: 'IN_PROGRESS' } }),
	);
	await a.rejects(waitForAudioResult(c, 'saved', 3), /polling limit/);
	a.equal(c.calls.length, 3);
});
test('concat submits once and waits for usable video URL', async (t) => {
	t.mock.method(videoDelays, 'waitBeforeVideoPoll', async () => {});
	const c = context([
		{ transaction_id: 'saved' },
		{ status: 'processing', data: { url: 'https://example.com/stale.mp4' } },
		{ status: 'success', data: { url: 'https://example.com/final.mp4' } },
	]);
	const out = [];
	await executeConcat(c, 0, out);
	a.equal(out[0].json.video_url, 'https://example.com/final.mp4');
	a.equal(out[0].json.completed, true);
	a.equal(c.calls.filter((c) => c.method === 'POST').length, 1);
});
for (const response of [
	{ status: 'failed' },
	{ status: 'success', data: { url: 'http://example.com/unsafe.mp4' } },
	{ status: 'success', transaction_id: 'other', data: { url: 'https://example.com/wrong.mp4' } },
])
	test(
		'concat rejects unusable output and retains saved ID ' + JSON.stringify(response),
		async () => {
			const c = context([{ transaction_id: 'saved' }, response]);
			await a.rejects(executeConcat(c, 0, []), /Preserve transaction ID: saved/);
			a.equal(c.calls.length, 2);
		},
	);
