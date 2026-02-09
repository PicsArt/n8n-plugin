import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';

export async function executeVideoWatermark(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get parameters
	const videoUrl: string = context.getNodeParameter('video_url', itemIndex) as string;
	const watermarkSource: string = context.getNodeParameter('watermarkSource', itemIndex, 'url') as string;
	const watermarkBinaryField: string = context.getNodeParameter('watermarkBinaryField', itemIndex, '') as string;
	const watermarkUrl: string = context.getNodeParameter('watermark_url', itemIndex, '') as string;
	const anchorPoint: string = context.getNodeParameter('anchor_point', itemIndex, 'center-middle') as string;
	const watermarkWidth: number = context.getNodeParameter('watermark_width', itemIndex, 0) as number;
	const watermarkHeight: number = context.getNodeParameter('watermark_height', itemIndex, 0) as number;
	const watermarkOpacity: number = context.getNodeParameter('watermark_opacity', itemIndex, 50) as number;
	const watermarkAngle: number = context.getNodeParameter('watermark_angle', itemIndex, 0) as number;
	const watermarkPaddingX: number = context.getNodeParameter('watermark_padding_x', itemIndex, 0) as number;
	const watermarkPaddingY: number = context.getNodeParameter('watermark_padding_y', itemIndex, 0) as number;

	// Polling configuration (hardcoded, not exposed to user)
	const maxPollAttempts: number = 600; // maximum attempts (API rate limiting will slow this down)

	// Validate video URL
	if (!videoUrl || videoUrl.trim().length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Video URL is required and cannot be empty',
			{ itemIndex }
		);
	}

	// Validate URL format
	try {
		new URL(videoUrl);
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid video URL format. Please provide a valid URL',
			{ itemIndex }
		);
	}

	// Check watermark source
	let watermarkBuffer = null;
	let watermarkFileName = 'watermark.png';
	let watermarkMimeType = 'image/png';

	if (watermarkSource === 'binary') {
		if (!watermarkBinaryField) {
			throw new NodeOperationError(
				context.getNode(),
				'Watermark Binary Field is required when using Binary watermark source',
				{ itemIndex }
			);
		}
		try {
			const watermarkData = context.helpers.assertBinaryData(itemIndex, watermarkBinaryField);
			watermarkBuffer = await context.helpers.getBinaryDataBuffer(itemIndex, watermarkBinaryField);
			watermarkFileName = watermarkData.fileName || (watermarkData.fileExtension ? `watermark.${watermarkData.fileExtension}` : 'watermark.png');
			watermarkMimeType = watermarkData.mimeType || 'image/png';
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Watermark binary data not found in field "${watermarkBinaryField}". Please ensure the watermark image is provided.`,
				{ itemIndex }
			);
		}
	} else if (watermarkSource === 'url') {
		if (!watermarkUrl) {
			throw new NodeOperationError(
				context.getNode(),
				'Watermark URL is required when using URL watermark source',
				{ itemIndex }
			);
		}
	}

	let transactionId: string;
	let result: any;

	try {
		// Step 1: Submit the video watermark request
		// POST https://video-api.picsart.io/v1/watermark
		const formFields: Record<string, string | { data: any; filename?: string; contentType?: string }> = {};

		// Add video URL
		formFields.video_url = videoUrl;

		// Add watermark
		if (watermarkBuffer) {
			formFields.watermark = {
				data: watermarkBuffer,
				filename: watermarkFileName,
				contentType: watermarkMimeType,
			};
		} else {
			formFields.watermark_url = watermarkUrl;
		}

		// Add other parameters
		formFields.anchor_point = anchorPoint;

		if (watermarkWidth > 0) {
			formFields.watermark_width = watermarkWidth.toString();
		}

		if (watermarkHeight > 0) {
			formFields.watermark_height = watermarkHeight.toString();
		}

		formFields.watermark_opacity = watermarkOpacity.toString();

		if (watermarkAngle > 0) {
			formFields.watermark_angle = watermarkAngle.toString();
		}

		formFields.watermark_padding_x = watermarkPaddingX.toString();
		formFields.watermark_padding_y = watermarkPaddingY.toString();

		const multipart = buildMultipartFormData(formFields);

		const submitResponse = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://video-api.picsart.io/v1/watermark',
				headers: {
					'Accept': 'application/json',
					'Content-Type': multipart.contentType,
				},
				body: multipart.body,
			},
		);
		
		// Extract transaction ID from response
		transactionId = submitResponse.inference_id || submitResponse.id || submitResponse.transaction_id || submitResponse.transactionId;
		
		if (!transactionId) {
			throw new NodeOperationError(
				context.getNode(),
				'Failed to get transaction ID from API response. Response: ' + JSON.stringify(submitResponse),
				{ itemIndex }
			);
		}

		// Step 2: Poll for the result
		// GET https://video-api.picsart.io/v1/watermark/{transaction_id}
		let pollAttempts = 0;
		let videoResultUrl: string | null = null;

		while (pollAttempts < maxPollAttempts) {
			try {
				result = await context.helpers.httpRequestWithAuthentication.call(
					context,
					'picsartApi',
					{
						method: 'GET',
						url: `https://video-api.picsart.io/v1/watermark/${transactionId}`,
						headers: {
							'Accept': 'application/json',
						},
					},
				);
				
				// Check if the result is ready
				if (result.status === 'completed' || result.status === 'success') {
					// Handle data as object with url property
					if (result.data?.url) {
						videoResultUrl = result.data.url;
						if (videoResultUrl) {
							break;
						}
					}
					// Fallback: direct url property
					else if (result.url) {
						videoResultUrl = result.url;
						if (videoResultUrl) {
							break;
						}
					}
					// Fallback: data as array
					else if (Array.isArray(result.data) && result.data.length > 0) {
						videoResultUrl = result.data[0]?.url;
						if (videoResultUrl) {
							break;
						}
					}
				}

				// Check if failed
				if (result.status === 'failed' || result.status === 'error') {
					throw new NodeOperationError(
						context.getNode(),
						`Video watermark failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
						{ itemIndex }
					);
				}

				// Still processing - continue polling
				pollAttempts++;
			} catch (error: any) {
				// If it's a 404, the transaction might not be ready yet
				if (error.statusCode === 404 || error.response?.status === 404) {
					pollAttempts++;
					continue;
				}
				// Otherwise, re-throw the error
				throw error;
			}
		}

		if (!videoResultUrl) {
			throw new NodeOperationError(
				context.getNode(),
				`Video watermark timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}. Last response: ${JSON.stringify(result)}. The video may still be processing - please try again in a few moments or contact support if the issue persists.`,
				{ itemIndex }
			);
		}

		// Step 3: Download the watermarked video
		const videoBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: videoResultUrl,
			encoding: 'arraybuffer',
		});

		// Return the watermarked video as binary data
		returnData.push({
			binary: {
				data: await context.helpers.prepareBinaryData(videoBuffer, 'watermarked-video.mp4'),
			},
			json: {
				videoUrl,
				watermarkSource: watermarkBuffer ? `[Binary: ${watermarkFileName}]` : watermarkUrl,
				anchorPoint,
				watermarkWidth,
				watermarkHeight,
				watermarkOpacity,
				watermarkAngle,
				watermarkPaddingX,
				watermarkPaddingY,
				transactionId,
				resultUrl: videoResultUrl,
				result,
			},
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}
}
