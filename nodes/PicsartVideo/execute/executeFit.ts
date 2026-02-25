import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import type { VideoApiResult, HttpError } from './types';

const FIT_API_URL = 'https://video-api.picsart.io/v1/fit';
const VIDEO_RESULT_URL = 'https://video-api.picsart.io/v1/video';
const maxPollAttempts = 600;

export async function executeFit(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const videoUrl = context.getNodeParameter('videoUrl', itemIndex) as string;
	const mode = context.getNodeParameter('mode', itemIndex, 'simple') as string;

	// Ratio is always available for Fit Video
	const ratio = context.getNodeParameter('fitRatio', itemIndex, undefined) as number | undefined;

	let width: number | undefined;
	let height: number | undefined;
	let bgColor: string | undefined;
	let bgBlur: number | undefined;
	let bgImageUrl: string | undefined;
	let bgVideoUrl: string | undefined;

	if (mode === 'advanced') {
		width = context.getNodeParameter('fitWidth', itemIndex, undefined) as number | undefined;
		height = context.getNodeParameter('fitHeight', itemIndex, undefined) as number | undefined;
		bgColor = context.getNodeParameter('fitBgColor', itemIndex, '') as string;
		bgBlur = context.getNodeParameter('fitBgBlur', itemIndex, 0) as number;
		bgImageUrl = context.getNodeParameter('fitBgImageUrl', itemIndex, '') as string;
		bgVideoUrl = context.getNodeParameter('fitBgVideoUrl', itemIndex, '') as string;
	} else {
		width = undefined;
		height = undefined;
		bgColor = undefined;
		bgBlur = 0;
		bgImageUrl = undefined;
		bgVideoUrl = undefined;
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

	if (ratio != null && (ratio < 0.1 || ratio > 10)) {
		throw new NodeOperationError(
			context.getNode(),
			'Ratio must be between 0.1 and 10 (width/height)',
			{ itemIndex },
		);
	}

	if (width != null && width < 1) {
		throw new NodeOperationError(
			context.getNode(),
			'Width must be >= 1',
			{ itemIndex },
		);
	}

	if (height != null && height < 1) {
		throw new NodeOperationError(
			context.getNode(),
			'Height must be >= 1',
			{ itemIndex },
		);
	}

	if (bgBlur != null && (bgBlur < 0 || bgBlur > 100)) {
		throw new NodeOperationError(
			context.getNode(),
			'Background blur must be between 0 and 100',
			{ itemIndex },
		);
	}

	// Only one of bg_color, bg_image_url, bg_video_url allowed
	const hasBgColor = bgColor != null && String(bgColor).trim().length > 0;
	const hasBgImage = bgImageUrl != null && String(bgImageUrl).trim().length > 0;
	const hasBgVideo = bgVideoUrl != null && String(bgVideoUrl).trim().length > 0;
	if ([hasBgColor, hasBgImage, hasBgVideo].filter(Boolean).length > 1) {
		throw new NodeOperationError(
			context.getNode(),
			'Use only one of Background Color, Background Image URL, or Background Video URL.',
			{ itemIndex },
		);
	}

	try {
		const body: Record<string, unknown> = {
			video_url: videoUrl,
		};

		if (ratio != null) body.ratio = ratio;
		if (width != null) body.width = width;
		if (height != null) body.height = height;
		if (hasBgColor) body.bg_color = String(bgColor).trim();
		else if (hasBgImage) body.bg_image_url = String(bgImageUrl).trim();
		else if (hasBgVideo) body.bg_video_url = String(bgVideoUrl).trim();
		if (bgBlur != null && bgBlur > 0) body.bg_blur = bgBlur;

		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: FIT_API_URL,
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
							'fit-video.mp4',
							'video/mp4',
						),
					},
					json: { videoUrl: resultUrl, video_url: videoUrl, fit: body },
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
							'fit-video.mp4',
							'video/mp4',
						),
					},
					json: {
						videoUrl: url,
						video_url: videoUrl,
						transactionId,
						fit: body,
					},
				});
				return;
			}

			if (result.status === 'error' || result.status === 'failed') {
				throw new NodeOperationError(
					context.getNode(),
					`Fit failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
					{ itemIndex },
				);
			}

			pollAttempts++;
		}

		throw new NodeOperationError(
			context.getNode(),
			`Fit timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}.`,
			{ itemIndex },
		);
	} catch (error: unknown) {
		handleApiError(context, error, itemIndex);
	}
}
