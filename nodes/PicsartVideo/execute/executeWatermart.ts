import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import type { VideoApiResult, HttpError } from './types';
import { buildMultipartFormData } from './utils';

const WATERMARK_API_URL = 'https://video-api.picsart.io/v1/watermark';
const maxPollAttempts = 600;

export async function executeWatermark(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const videoUrl = context.getNodeParameter('videoUrl', itemIndex) as string;
	const watermarkSource = context.getNodeParameter('watermarkSource', itemIndex) as string;
	const anchorPoint = context.getNodeParameter('anchorPoint', itemIndex, 'center-middle') as string;
	const watermarkUrl = context.getNodeParameter('watermarkUrl', itemIndex, '') as string;
	const mode = context.getNodeParameter('mode', itemIndex, 'simple') as string;
	let exportFormat: string;
	let watermarkWidth: number | null;
	let watermarkHeight: number | null;
	let watermarkOpacity: number;
	let watermarkAngle: number | null;
	let watermarkPaddingX: number | null;
	let watermarkPaddingY: number | null;
	if (mode === 'advanced') {
		exportFormat = context.getNodeParameter('exportFormat', itemIndex, 'MP4') as string;
		watermarkWidth = context.getNodeParameter('watermarkWidth', itemIndex, null) as number | null;
		watermarkHeight = context.getNodeParameter('watermarkHeight', itemIndex, null) as number | null;
		watermarkOpacity = context.getNodeParameter('watermarkOpacity', itemIndex, 50) as number;
		watermarkAngle = context.getNodeParameter('watermarkAngle', itemIndex, null) as number | null;
		watermarkPaddingX = context.getNodeParameter('watermarkPaddingX', itemIndex, 0) as number;
		watermarkPaddingY = context.getNodeParameter('watermarkPaddingY', itemIndex, 0) as number;
	} else {
		exportFormat = 'MP4';
		watermarkWidth = null;
		watermarkHeight = null;
		watermarkOpacity = 50;
		watermarkAngle = null;
		watermarkPaddingX = 0;
		watermarkPaddingY = 0;
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

	if (watermarkSource === 'url') {
		if (!watermarkUrl || watermarkUrl.trim().length === 0) {
			throw new NodeOperationError(
				context.getNode(),
				'Watermark URL is required when using URL as watermark source',
				{ itemIndex },
			);
		}
	} else {
		const binaryPropertyName = context.getNodeParameter('watermarkBinaryPropertyName', itemIndex) as string;
		const item = context.getInputData()[itemIndex];
		if (!item?.binary?.[binaryPropertyName]) {
			throw new NodeOperationError(
				context.getNode(),
				`No binary data found for property "${binaryPropertyName}". Provide a watermark image when using binary source.`,
				{ itemIndex },
			);
		}
	}

	if (watermarkOpacity < 0 || watermarkOpacity > 100) {
		throw new NodeOperationError(
			context.getNode(),
			'Watermark opacity must be between 0 and 100',
			{ itemIndex },
		);
	}

	if (watermarkAngle && (watermarkAngle < 0 || watermarkAngle > 360)) {
		throw new NodeOperationError(
			context.getNode(),
			'Watermark angle must be between 0 and 360',
			{ itemIndex },
		);
	}

	if (watermarkPaddingX < 0 || watermarkPaddingY < 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Watermark padding must be >= 0',
			{ itemIndex },
		);
	}
	try {
		const formFields: Record<string, string | { data: unknown; filename?: string; contentType?: string }> = {
			video_url: videoUrl,
			anchor_point: anchorPoint,
			watermark_opacity: String(watermarkOpacity),
			watermark_padding_x: String(watermarkPaddingX),
			watermark_padding_y: String(watermarkPaddingY),
			format: exportFormat,
		};

		if (watermarkWidth != null && watermarkWidth >= 1) {
			formFields.watermark_width = String(watermarkWidth);
		}
		if (watermarkHeight != null && watermarkHeight >= 1) {
			formFields.watermark_height = String(watermarkHeight);
		}
		if (watermarkAngle != null) {
			formFields.watermark_angle = String(watermarkAngle);
		}

		if (watermarkSource === 'url') {
			formFields.watermark_url = watermarkUrl;
		} else {
			const binaryPropertyName = context.getNodeParameter('watermarkBinaryPropertyName', itemIndex) as string;
			const binaryData = context.getInputData()[itemIndex].binary![binaryPropertyName];
			const data = await context.helpers.binaryToBuffer(binaryData);
			const filename = binaryData.fileName || 'watermark.png';
			const mimeType = binaryData.mimeType || 'image/png';
			formFields.watermark = { data, filename, contentType: mimeType };
		}
		const { body, contentType } = buildMultipartFormData(formFields);
		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: WATERMARK_API_URL,
				headers: {
					'Content-Type': contentType,
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
							url: `https://video-api.picsart.io/v1/video/${transactionId}`,
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
						`Watermark failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
						{ itemIndex },
					);
				}
				pollAttempts++;
			}

			if (!resultVideoUrl) {
				throw new NodeOperationError(
					context.getNode(),
					`Watermark timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}.`,
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
					'watermarked-video.mp4',
					'video/mp4',
				),
			},
			json: {
				videoUrl: resultVideoUrl,
				video_url: videoUrl,
				anchor_point: anchorPoint,
				watermark_opacity: watermarkOpacity,
				watermark_padding_x: watermarkPaddingX,
				watermark_padding_y: watermarkPaddingY,
				...(transactionId && { transactionId }),
			},
		});
	} catch (error: unknown) {
		handleApiError(context, error, itemIndex);
	}
}
