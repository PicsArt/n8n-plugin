import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { picsartCredentialType } from '../../authentication';
import { submissionResult } from './submissionResult';
import type { VideoApiResult } from './types';
import { maxPollAttempts, waitBeforeVideoPoll } from './polling';

/** Submit once and return completed media; preserve the transaction on failure. */
export async function executeConcat(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const input = context.getNodeParameter('videoUrls', itemIndex) as string;
	const urls =
		typeof input === 'string'
			? input
					.split(/\r?\n/)
					.map((value) => value.trim())
					.filter(Boolean)
			: [];
	if (urls.length < 2 || urls.length > 10)
		throw new NodeOperationError(
			context.getNode(),
			'Provide 2 to 10 video URLs in playback order',
			{ itemIndex },
		);
	for (const value of urls) {
		let url: URL;
		try {
			url = new URL(value);
		} catch {
			throw new NodeOperationError(context.getNode(), 'Every video must have a valid HTTPS URL', {
				itemIndex,
			});
		}
		if (url.protocol !== 'https:' || url.username || url.password)
			throw new NodeOperationError(
				context.getNode(),
				'Every video must have an HTTPS URL without embedded credentials',
				{ itemIndex },
			);
	}
	let transactionId: string | undefined;
	try {
		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			picsartCredentialType(context),
			{
				method: 'POST',
				url: 'https://video-api.picsart.io/v1/concat',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: {
					items: urls.map((video_url) => ({ video_url, transition: 'none' })),
					export: { format: 'MP4', frame_rate: 30 },
				},
			},
		);
		transactionId =
			response?.transaction_id ?? response?.inference_id ?? response?.id ?? response?.job_id;
		if (typeof transactionId !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(transactionId))
			throw new Error('Submission returned no valid transaction ID');
		submissionResult(response);
		for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
			await waitBeforeVideoPoll(attempt);
			const result: VideoApiResult = await context.helpers.httpRequestWithAuthentication.call(
				context,
				picsartCredentialType(context),
				{
					method: 'GET',
					url: 'https://video-api.picsart.io/v1/video/' + encodeURIComponent(transactionId),
					headers: { Accept: 'application/json' },
					timeout: 30000,
				},
			);
			if (result.transaction_id !== undefined && result.transaction_id !== transactionId)
				throw new Error('Mismatched video transaction ID');
			if (['success', 'completed'].includes(result.status ?? '')) {
				const media = result.data?.url ?? result.url ?? result.result?.url;
				if (typeof media !== 'string') throw new Error('Completed video has no output URL');
				const parsed = new URL(media);
				if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
					throw new Error('Completed video requires a valid HTTPS output URL');
				returnData.push({
					json: {
						id: transactionId,
						transaction_id: transactionId,
						status: 'success',
						completed: true,
						video_url: media,
						videoUrl: media,
					},
					pairedItem: { item: itemIndex },
				});
				return;
			}
			if (
				![
					'accepted',
					'pending',
					'processing',
					'queued',
					'submitted',
					'running',
					'in_progress',
				].includes(result.status ?? '')
			)
				throw new Error('Video task failed or returned an unknown status');
		}
		throw new Error('Video polling limit reached');
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new NodeOperationError(
			context.getNode(),
			`${message}. ${transactionId ? `Preserve transaction ID: ${transactionId}. Retrieve this existing transaction.` : 'Submission was not confirmed; inspect existing jobs before retrying.'} Do not automatically resubmit.`,
			{ itemIndex },
		);
	}
}
