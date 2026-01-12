import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

import { text2ImageProperties } from './text2ImageProperties';

export class PicsartText2Image implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Text2Image',
		name: 'picsartText2Image',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description: 'Generate images from text prompts using Picsart GenAI API',
		defaults: {
			name: 'Picsart Text2Image',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'picsartApi',
				required: true,
			},
		],
		properties: [
			...text2ImageProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items: INodeExecutionData[] = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				await executeText2Image(this, itemIndex, returnData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: items[itemIndex].json, error, pairedItem: itemIndex });
				} else {
					if (error instanceof NodeOperationError) {
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error.message, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}

async function executeText2Image(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get parameters
	const prompt: string = context.getNodeParameter('prompt', itemIndex) as string;
	const width: number = context.getNodeParameter('width', itemIndex, 1024) as number;
	const height: number = context.getNodeParameter('height', itemIndex, 1024) as number;
	// Polling configuration (hardcoded, not exposed to user)
	const pollInterval: number = 2; // seconds
	const maxPollAttempts: number = 30; // maximum attempts

	// Validate prompt
	if (!prompt || prompt.trim().length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Prompt is required and cannot be empty',
			{ itemIndex }
		);
	}

	// Validate dimensions
	if (width < 1 || width > 1024) {
		throw new NodeOperationError(
			context.getNode(),
			'Width must be between 1 and 1024 pixels',
			{ itemIndex }
		);
	}

	if (height < 1 || height > 1024) {
		throw new NodeOperationError(
			context.getNode(),
			'Height must be between 1 and 1024 pixels',
			{ itemIndex }
		);
	}

	let transactionId: string;
	let result: any;

	try {
		// Step 1: Submit the text2image request
		// POST https://genai-api.picsart.io/v1/text2image
		const submitResponse = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://genai-api.picsart.io/v1/text2image',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: {
					prompt,
					width,
					height,
					"model": "urn:air:sdxl:model:fluxai:flux_kontext_max@1"
				},
			},
		);
		// Extract transaction ID from response
		// The API returns a transaction_id or id field
		transactionId = submitResponse.inference_id || submitResponse.id || submitResponse.transactionId;
		
		if (!transactionId) {
			throw new NodeOperationError(
				context.getNode(),
				'Failed to get transaction ID from API response. Response: ' + JSON.stringify(submitResponse),
				{ itemIndex }
			);
		}

		// Step 2: Poll for the result
		// GET https://genai-api.picsart.io/v1/text2image/{transaction_id}
		let pollAttempts = 0;
		let imageUrl: string | null = null;

		while (pollAttempts < maxPollAttempts) {
			// Wait before polling (except on first attempt)
			if (pollAttempts > 0) {
				await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
			}

			try {
				result = await context.helpers.httpRequestWithAuthentication.call(
					context,
					'picsartApi',
					{
						method: 'GET',
						url: `https://genai-api.picsart.io/v1/text2image/inferences/${transactionId}`,
						headers: {
							'Accept': 'application/json',
						},
					},
				);
				// Check if the result is ready
				// The API returns status: 'success' with data as an array: [{ url: '...' }, ...]
				if (result.status === 'completed' || result.status === 'success') {
					// Handle data as array (multiple images possible)
					if (Array.isArray(result.data) && result.data.length > 0) {
						// Take the first image URL from the array
						imageUrl = result.data[0].url;
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
						`Image generation failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
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
				`Image generation timed out after ${maxPollAttempts} attempts. Transaction ID: ${transactionId}. Last response: ${JSON.stringify(result)}`,
				{ itemIndex }
			);
		}

		// Step 3: Download the generated image
		const imageBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: imageUrl,
			encoding: 'arraybuffer',
		});

		// Return the generated image
		returnData.push({
			binary: {
				data: await context.helpers.prepareBinaryData(imageBuffer, 'generated-image.png'),
			},
			json: {
				prompt,
				width,
				height,
				transactionId,
				imageUrl,
				result,
			},
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}
}

function handleApiError(context: IExecuteFunctions, error: any, itemIndex: number): void {
	const statusCode = error.response?.status || error.statusCode || error.httpCode;
	const errorMessage =
		error.context?.data?.detail ||
		error.response?.data?.detail ||
		error.response?.data?.message ||
		error.context?.data?.message ||
		error.message;

	if (statusCode === 429) {
		throw new NodeOperationError(
			context.getNode(),
			`Insufficient credits or rate limit exceeded. Please check your Picsart account balance. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else if (statusCode === 401 || statusCode === 403) {
		throw new NodeOperationError(
			context.getNode(),
			`Authentication failed. Please check your API key is valid. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else if (statusCode >= 400 && statusCode < 500) {
		throw new NodeOperationError(
			context.getNode(),
			`Client error: ${errorMessage || 'Invalid request parameters. Please check your input data.'}`,
			{ itemIndex }
		);
	} else if (statusCode >= 500) {
		throw new NodeOperationError(
			context.getNode(),
			`Picsart API server error (${statusCode}). Please try again later. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else {
		throw new NodeOperationError(
			context.getNode(),
			`Failed to generate image: ${errorMessage || error.message}`,
			{ itemIndex }
		);
	}
}
