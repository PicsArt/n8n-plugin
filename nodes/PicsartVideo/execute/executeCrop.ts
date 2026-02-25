import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import type { VideoApiResult, HttpError } from './types';

const CROP_API_URL = 'https://video-api.picsart.io/v1/crop';
const VIDEO_RESULT_URL = 'https://video-api.picsart.io/v1/video';
const maxPollAttempts = 600;

export async function executeCrop(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const videoUrl = context.getNodeParameter('videoUrl', itemIndex) as string;
	const width = context.getNodeParameter('width', itemIndex) as number;
	const height = context.getNodeParameter('height', itemIndex) as number;
	const startX = context.getNodeParameter('startX', itemIndex, 0) as number;
	const startY = context.getNodeParameter('startY', itemIndex, 0) as number;
	const mode = context.getNodeParameter('mode', itemIndex, 'simple') as string;
	const format = mode === 'advanced'
		? (context.getNodeParameter('cropExportFormat', itemIndex, 'MP4') as string)
		: 'MP4';

		
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

	if (width < 16) {
		throw new NodeOperationError(
			context.getNode(),
			'Width must be at least 16 px',
			{ itemIndex },
		);
	}

	if (height < 16) {
		throw new NodeOperationError(
			context.getNode(),
			'Height must be at least 16 px',
			{ itemIndex },
		);
	}

	if (startX < 0 || startY < 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Start X and Start Y must be >= 0',
			{ itemIndex },
		);
	}

	try {
		const body: Record<string, unknown> = {
			video_url: videoUrl,
			width,
			height,
			start_x: startX,
			start_y: startY,
			export: { format },
		};

		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: CROP_API_URL,
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
				const videoBuffer = await context.helpers.httpRequest({
					method: 'GET',
					url: resultUrl,
					encoding: 'arraybuffer',
				});
				returnData.push({
					binary: {
						data: await context.helpers.prepareBinaryData(
							videoBuffer,
							'cropped-video.mp4',
							'video/mp4',
						),
					},
					json: {
						videoUrl: resultUrl,
						video_url: videoUrl,
						width,
						height,
						start_x: startX,
						start_y: startY,
						export: { format },
					},
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
				const url = result.data.url;
				const videoBuffer = await context.helpers.httpRequest({
					method: 'GET',
					url,
					encoding: 'arraybuffer',
				});
				returnData.push({
					binary: {
						data: await context.helpers.prepareBinaryData(
							videoBuffer,
							'cropped-video.mp4',
							'video/mp4',
						),
					},
					json: {
						videoUrl: url,
						video_url: videoUrl,
						transactionId,
						width,
						height,
						start_x: startX,
						start_y: startY,
						export: { format },
					},
				});
				return;
			}

			if (result.status === 'error' || result.status === 'failed') {
				throw new NodeOperationError(
					context.getNode(),
					`Crop failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
					{ itemIndex },
				);
			}

			pollAttempts++;
		}

		throw new NodeOperationError(
			context.getNode(),
			`Crop timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}.`,
			{ itemIndex },
		);
	} catch (error: unknown) {
		handleApiError(context, error, itemIndex);
	}
}
