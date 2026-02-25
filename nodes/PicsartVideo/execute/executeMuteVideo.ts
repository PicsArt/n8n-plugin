import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import type { VideoApiResult, HttpError } from './types';

const AUDIO_ADJUST_API_URL = 'https://video-api.picsart.io/v1/audio/adjust';
const VIDEO_RESULT_URL = 'https://video-api.picsart.io/v1/video';
const maxPollAttempts = 600;

export async function executeMuteVideo(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const videoUrl = context.getNodeParameter('videoUrl', itemIndex) as string;
	const mode = context.getNodeParameter('mode', itemIndex) as string;
	const mute = mode === 'advanced'
		? (context.getNodeParameter('mute', itemIndex) as boolean)
		: true;

	if (!videoUrl || videoUrl.trim().length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Video URL is required',
			{ itemIndex },
		);
	}

	if (videoUrl.length > 2083) {
		throw new NodeOperationError(
			context.getNode(),
			'Video URL must be at most 2083 characters',
			{ itemIndex },
		);
	}

	try {
		const body: { video_url: string; video_volume: number } = {
			video_url: videoUrl,
			video_volume: mute ? 0 : 100,
		};

		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: AUDIO_ADJUST_API_URL,
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body,
			},
		);

		let resultVideoUrl: string | null = null;
		let transactionId: string | null = null;

		if (response.data?.url) {
			resultVideoUrl = response.data.url;
		} else if (response.url) {
			resultVideoUrl = response.url;
		} else if (response.result?.url) {
			resultVideoUrl = response.result.url;
		} else if (response.inference_id || response.id || response.job_id || response.transaction_id) {
			transactionId =
				response.inference_id ||
				response.id ||
				response.job_id ||
				response.transaction_id;
		}

		if (transactionId && !resultVideoUrl) {
			let pollAttempts = 0;
			let result: VideoApiResult = response as VideoApiResult;

			while (pollAttempts < maxPollAttempts) {
				try {
					result = await context.helpers.httpRequestWithAuthentication.call(
						context,
						'picsartApi',
						{
							method: 'GET',
							url: `${VIDEO_RESULT_URL}/${transactionId}`,
							headers: { Accept: 'application/json' },
						},
					);
				} catch (err: unknown) {
					const httpErr = err as HttpError;
				if (httpErr.statusCode === 404 || httpErr.response?.status === 404) {
						pollAttempts++;
						continue;
					}
					throw err;
				}

				if (result.status === 'completed' || result.status === 'success') {
					resultVideoUrl = result.data?.url ?? result.url ?? result.result?.url ?? null;
					if (resultVideoUrl) break;
				}
				if (result.status === 'failed' || result.status === 'error') {
					throw new NodeOperationError(
						context.getNode(),
						`Mute video failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
						{ itemIndex },
					);
				}
				pollAttempts++;
			}

			if (!resultVideoUrl) {
				throw new NodeOperationError(
					context.getNode(),
					`Mute video timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}.`,
					{ itemIndex },
				);
			}
		}

		if (!resultVideoUrl) {
			throw new NodeOperationError(
				context.getNode(),
				`Unexpected API response: no result URL or job ID. Response: ${JSON.stringify(response)}`,
				{ itemIndex },
			);
		}

		const videoBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: resultVideoUrl,
			encoding: 'arraybuffer',
		});

		returnData.push({
			binary: {
				data: await context.helpers.prepareBinaryData(
					videoBuffer,
					'muted-video.mp4',
					'video/mp4',
				),
			},
			json: {
				videoUrl: resultVideoUrl,
				video_url: videoUrl,
				mute,
				...(transactionId && { transactionId }),
			},
		});
	} catch (error: unknown) {
		handleApiError(context, error, itemIndex);
	}
}
