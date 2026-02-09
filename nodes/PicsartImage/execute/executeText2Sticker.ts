import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';

export async function executeText2Sticker(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get parameters
	const prompt: string = context.getNodeParameter('prompt', itemIndex) as string;
	const width: number = context.getNodeParameter('width', itemIndex, 1024) as number;
	const height: number = context.getNodeParameter('height', itemIndex, 1024) as number;
	const count: number = context.getNodeParameter('count', itemIndex, 2) as number;
	
	// Polling configuration (hardcoded, not exposed to user)
	// Note: We use many attempts as n8n doesn't allow setTimeout in community nodes
	// The API will naturally rate-limit if we poll too fast
	const maxPollAttempts: number = 600; // maximum attempts (API rate limiting will slow this down)

	// Validate prompt
	if (!prompt || prompt.trim().length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Prompt is required and cannot be empty',
			{ itemIndex }
		);
	}

	// Validate dimensions
	if (width < 64 || width > 1024) {
		throw new NodeOperationError(
			context.getNode(),
			'Width must be between 64 and 1024 pixels',
			{ itemIndex }
		);
	}

	if (height < 64 || height > 1024) {
		throw new NodeOperationError(
			context.getNode(),
			'Height must be between 64 and 1024 pixels',
			{ itemIndex }
		);
	}

	// Validate count
	if (count < 1 || count > 10) {
		throw new NodeOperationError(
			context.getNode(),
			'Count must be between 1 and 10',
			{ itemIndex }
		);
	}

	try {
		// Make separate API calls for each sticker based on count
		for (let stickerIndex = 0; stickerIndex < count; stickerIndex++) {
			let transactionId: string;
			let result: any;
			// Step 1: Submit the text2sticker request
			// POST https://genai-api.picsart.io/v1/text2sticker
			const submitResponse = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'picsartApi',
				{
					method: 'POST',
					url: 'https://genai-api.picsart.io/v1/text2sticker',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
				body: {
					prompt,
					width,
					height,
				},
				},
			);
			
			// Extract transaction ID from response
			transactionId = submitResponse.inference_id || submitResponse.id || submitResponse.transactionId;
			if (!transactionId) {
				throw new NodeOperationError(
					context.getNode(),
					'Failed to get transaction ID from API response. Response: ' + JSON.stringify(submitResponse),
					{ itemIndex }
				);
			}

			// Step 2: Poll for the result
			// GET https://genai-api.picsart.io/v1/text2sticker/inferences/{transaction_id}
			let pollAttempts = 0;
			let imageUrl: string | null = null;

			while (pollAttempts < maxPollAttempts) {
				// Note: n8n community nodes cannot use setTimeout
				// The API's rate limiting will naturally slow down rapid polling
				try {
					result = await context.helpers.httpRequestWithAuthentication.call(
						context,
						'picsartApi',
						{
							method: 'GET',
							url: `https://genai-api.picsart.io/v1/text2sticker/inferences/${transactionId}`,
							headers: {
								'Accept': 'application/json',
							},
						},
					);
					// Check if the result is ready
					// The API returns status: 'success' with data
					if (result.status === 'completed' || result.status === 'success') {
						// Handle data as array (take first image)
						if (Array.isArray(result.data) && result.data.length > 0) {
							imageUrl = result.data[0]?.url;
							if (imageUrl) {
								break;
							}
						}
						// Fallback: handle data as object with url property
						else if (result.data?.url) {
							imageUrl = result.data.url;
							if (imageUrl) {
								break;
							}
						}
						// Fallback: direct url property
						else if (result.url) {
							imageUrl = result.url;
							if (imageUrl) {
								break;
							}
						}
					}

					// Check if failed
					if (result.status === 'failed' || result.status === 'error') {
						throw new NodeOperationError(
							context.getNode(),
							`Sticker generation failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
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

			if (!imageUrl) {
				throw new NodeOperationError(
					context.getNode(),
					`Sticker generation timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}. Last response: ${JSON.stringify(result)}. The sticker may still be processing - please try again in a few moments or contact support if the issue persists.`,
					{ itemIndex }
				);
			}

			// Step 3: Download the generated sticker
			const imageBuffer = await context.helpers.httpRequest({
				method: 'GET',
				url: imageUrl,
				encoding: 'arraybuffer',
			});
			// Return each generated sticker as a separate item
			returnData.push({
				binary: {
					data: await context.helpers.prepareBinaryData(imageBuffer, `generated-sticker-${stickerIndex + 1}.png`),
				},
				json: {
					prompt,
					width,
					height,
					count,
					imageIndex: stickerIndex + 1,
					transactionId,
					imageUrl,
					result,
				},
			});
		}
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}
}
