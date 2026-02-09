import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';

export async function executeVideoFpsUpscale(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get parameters
	const videoUrl: string = context.getNodeParameter('video_url', itemIndex) as string;
	
	// Polling configuration (hardcoded, not exposed to user)
	// Note: We use many attempts as n8n doesn't allow setTimeout in community nodes
	// The API will naturally rate-limit if we poll too fast
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

	let transactionId: string;
	let result: any;

	try {
		// Step 1: Submit the video FPS upscale request
		// POST https://video-api.picsart.io/v1/upscale/fps
		const submitResponse = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://video-api.picsart.io/v1/upscale/fps',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: {
					video_url: videoUrl,
				},
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
		// GET https://video-api.picsart.io/v1/upscale/fps/{transaction_id}
		let pollAttempts = 0;
		let videoResultUrl: string | null = null;

		while (pollAttempts < maxPollAttempts) {
			// Note: n8n community nodes cannot use setTimeout
			// The API's rate limiting will naturally slow down rapid polling
			try {
				result = await context.helpers.httpRequestWithAuthentication.call(
					context,
					'picsartApi',
					{
						method: 'GET',
						url: `https://video-api.picsart.io/v1/upscale/fps/${transactionId}`,
						headers: {
							'Accept': 'application/json',
						},
					},
				);
				
				// Check if the result is ready
				// The API returns status: 'success' or 'completed' with data
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
						`Video FPS upscale failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
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
				`Video FPS upscale timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}. Last response: ${JSON.stringify(result)}. The video may still be processing - please try again in a few moments or contact support if the issue persists.`,
				{ itemIndex }
			);
		}

		// Step 3: Download the upscaled video
		const videoBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: videoResultUrl,
			encoding: 'arraybuffer',
		});

		// Return the upscaled video as binary data
		returnData.push({
			binary: {
				data: await context.helpers.prepareBinaryData(videoBuffer, 'upscaled-video-60fps.mp4'),
			},
			json: {
				videoUrl,
				transactionId,
				resultUrl: videoResultUrl,
				fps: 60,
				result,
			},
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}
}
