import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import type { VideoApiResult, HttpError } from './types';

const EDIT_API_URL = 'https://video-api.picsart.io/v1/edit';
const VIDEO_RESULT_URL = 'https://video-api.picsart.io/v1/video';
const maxPollAttempts = 600;

export async function executeCompressVideo(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const videoUrl = context.getNodeParameter('videoUrl', itemIndex) as string;
	const max_size_mb = context.getNodeParameter('max_size_mb', itemIndex) as number;

	const mode = context.getNodeParameter('mode', itemIndex, 'simple') as string;
	let codec: string;
	let format: string;
	let audioCodec: string;
	let bitrate: number | null;
	let colorSpace: string;
	if (mode === 'advanced') {
		codec = context.getNodeParameter('codec', itemIndex, 'default') as string;
		format = context.getNodeParameter('format', itemIndex, 'MP4') as string;
		audioCodec = context.getNodeParameter('audioCodec', itemIndex, 'default') as string;
		bitrate = context.getNodeParameter('bitrate', itemIndex, null) as number | null;
		colorSpace = context.getNodeParameter('colorSpace', itemIndex, 'SRGB') as string;
	} else {
		codec = 'default';
		format = 'MP4';
		audioCodec = 'default';
		bitrate = null;
		colorSpace = 'SRGB';
	}

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
		const exportParams: Record<string, string | number> = {
			codec,
			format,
			audio_codec: audioCodec,
			color_space: colorSpace,
		};
		if (bitrate != null && bitrate >= 1 && bitrate <= 10000) {
			exportParams.bitrate = bitrate;
		}

		const body: Record<string, unknown> = {
			video_url: videoUrl,
			max_size_mb,
			export: exportParams,
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
				const videoBuffer = await context.helpers.httpRequest({
					method: 'GET',
					url: resultUrl,
					encoding: 'arraybuffer',
				});
				returnData.push({
					binary: {
						data: await context.helpers.prepareBinaryData(
							videoBuffer,
							'edited-video.mp4',
							'video/mp4',
						),
					},
					json: { videoUrl: resultUrl, video_url: videoUrl, max_size_mb, export: exportParams },
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
				const resultVideoUrl = result.data.url;
				const videoBuffer = await context.helpers.httpRequest({
					method: 'GET',
					url: resultVideoUrl,
					encoding: 'arraybuffer',
				});
				returnData.push({
					binary: {
						data: await context.helpers.prepareBinaryData(
							videoBuffer,
							'edited-video.mp4',
							'video/mp4',
						),
					},
					json: {
						videoUrl: resultVideoUrl,
						video_url: videoUrl,
						max_size_mb,
						transactionId,
						export: exportParams,
					},
				});
				return;
			}

			if (result.status === 'error' || result.status === 'failed') {
				throw new NodeOperationError(
					context.getNode(),
					`Edit failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
					{ itemIndex },
				);
			}

			pollAttempts++;
		}

		throw new NodeOperationError(
			context.getNode(),
			`Edit timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}.`,
			{ itemIndex },
		);
	} catch (error: unknown) {
		handleApiError(context, error, itemIndex);
	}
}
