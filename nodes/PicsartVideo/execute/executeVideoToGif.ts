import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import type { VideoApiResult, HttpError } from './types';

const EDIT_API_URL = 'https://video-api.picsart.io/v1/edit';
const VIDEO_RESULT_URL = 'https://video-api.picsart.io/v1/video';
const maxPollAttempts = 600;

export async function executeVideoToGif(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const videoUrl = context.getNodeParameter('videoUrl', itemIndex) as string;

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
		const body = {
			video_url: videoUrl,
			export: {
				format: 'GIF',
				codec: 'gif',
			},
		};

		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: EDIT_API_URL,
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body,
			},
		);

		const transactionId =
			response.transaction_id ?? response.inference_id ?? response.id ?? response.job_id;

		if (!transactionId) {
			const resultUrl = response.data?.url ?? response.url ?? response.result?.url;
			if (resultUrl) {
				const gifBuffer = await context.helpers.httpRequest({
					method: 'GET',
					url: resultUrl,
					encoding: 'arraybuffer',
				});
				returnData.push({
					binary: {
						data: await context.helpers.prepareBinaryData(
							gifBuffer,
							'output.gif',
							'image/gif',
						),
					},
					json: { videoUrl: resultUrl, video_url: videoUrl, format: 'GIF'},
				});
				return;
			}
			throw new NodeOperationError(
				context.getNode(),
				`Unexpected API response: no transaction_id or result URL. Response: ${JSON.stringify(response)}`,
				{ itemIndex },
			);
		}

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

			if (result.status === 'success' && result.data?.url) {
				const resultUrl = result.data.url;
				const gifBuffer = await context.helpers.httpRequest({
					method: 'GET',
					url: resultUrl,
					encoding: 'arraybuffer',
				});
				returnData.push({
					binary: {
						data: await context.helpers.prepareBinaryData(
							gifBuffer,
							'output.gif',
							'image/gif',
						),
					},
					json: {
						videoUrl: resultUrl,
						video_url: videoUrl,
						transactionId,
						format: 'GIF',
					},
				});
				return;
			}

			if (result.status === 'error' || result.status === 'failed') {
				throw new NodeOperationError(
					context.getNode(),
					`Video to GIF failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
					{ itemIndex },
				);
			}

			pollAttempts++;
		}

		throw new NodeOperationError(
			context.getNode(),
			`Video to GIF timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}.`,
			{ itemIndex },
		);
	} catch (error: unknown) {
		handleApiError(context, error, itemIndex);
	}
}
