import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { enhanceProperties } from './enhanceProperties';
import { removeBgProperties } from './removeBgProperties';
import { text2ImageProperties } from './text2ImageProperties';

// Buffer type for Node.js (available at runtime)
// Declare Buffer as global to avoid requiring @types/node
declare const Buffer: {
	from(data: string | Uint8Array): any;
	isBuffer(obj: any): boolean;
	concat(buffers: any[]): any;
};

/**
 * Build multipart/form-data body manually (n8n Cloud doesn't allow form-data package)
 */
function buildMultipartFormData(fields: Record<string, string | any | { data: any; filename?: string; contentType?: string }>): { body: any; contentType: string } {
	const BufferClass = Buffer;
	const boundary = `----n8n-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
	const parts: any[] = [];
	
	for (const [key, value] of Object.entries(fields)) {
		parts.push(BufferClass.from(`--${boundary}\r\n`));
		
		if (BufferClass.isBuffer && BufferClass.isBuffer(value)) {
			// Binary data
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${key}"; filename="image.png"\r\n`));
			parts.push(BufferClass.from(`Content-Type: application/octet-stream\r\n\r\n`));
			parts.push(value);
		} else if (typeof value === 'object' && value !== null && 'data' in value) {
			// Object with data, filename, contentType
			const fileData = value as { data: any; filename?: string; contentType?: string };
			const filename = fileData.filename || 'image.png';
			const contentType = fileData.contentType || 'application/octet-stream';
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${key}"; filename="${filename}"\r\n`));
			parts.push(BufferClass.from(`Content-Type: ${contentType}\r\n\r\n`));
			parts.push(fileData.data);
		} else {
			// String value
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
			parts.push(BufferClass.from(String(value)));
		}
		parts.push(BufferClass.from(`\r\n`));
	}

	parts.push(BufferClass.from(`--${boundary}--\r\n`));

	return {
		body: BufferClass.concat(parts),
		contentType: `multipart/form-data; boundary=${boundary}`,
	};
}

export class PicsartImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart',
		name: 'picsartImage',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description: 'Process and generate images with Picsart API: generate from text, remove backgrounds, and enhance images',
		subtitle: '={{ $parameter["operation"] === "text2Image" ? $parameter["operation"] : $parameter["operation"] + ": " + $parameter["resource"] }}',
		defaults: {
			name: 'Picsart',
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
		// https://docs.n8n.io/integrations/creating-nodes/build/reference/code-standards/#resources-and-operations
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					
					{
						name: 'Remove Background',
						value: 'Remove Background',
						action: 'Remove background from an image',
						description: 'Remove background from an image',
					},
					{
						name: 'Enhance',
						value: 'Enhance',
						action: 'Enhance and upscale an image',
						description: 'Enhance and upscale an image',
					},
					{
						name: 'Text2Image',
						value: 'text2Image',
						action: 'Generate an image from text prompt',
						description: 'Generate an image from a text prompt using AI',
					}
				],
				default: 'Remove Background',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'DATA',
						value: 'DATA',
					},
					{
						name: 'Image URL',
						value: 'Image URL',
					}


				],
				default: 'Image URL',
				displayOptions: {
					show: {
						operation: ['Remove Background', 'Enhance'],
					},
				},
			},
			// Text2Image Operation Parameters
			...text2ImageProperties,
			// Remove Background Operation Parameters
            ...removeBgProperties,
			// Enhance Operation Parameters
            ...enhanceProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items: INodeExecutionData[] = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get operation
				const operation: string = this.getNodeParameter('operation', itemIndex) as string;

				if (operation === 'text2Image') {
					await executeText2Image(this, itemIndex, returnData);
				} else if (operation === 'Remove Background') {
					await executeRemoveBackground(this, itemIndex, returnData);
				} else if (operation === 'Enhance') {
					await executeEnhance(this, itemIndex, returnData);
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported!`,
						{ itemIndex }
					);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: items[itemIndex].json, error, pairedItem: itemIndex });
				} else {
					// Re-throw if it's already a NodeOperationError, otherwise wrap it
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

async function executeRemoveBackground(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get resource type
	const resource: string = context.getNodeParameter('resource', itemIndex) as string;
	
	// Get parameters
	const inputBinaryField: string = context.getNodeParameter('inputBinaryField', itemIndex, '') as string;
	const imageUrl: string = context.getNodeParameter('image_url', itemIndex, '') as string;
	const bgImageUrl: string = context.getNodeParameter('backgroundImage', itemIndex, '') as string;
	const bgColor: string = context.getNodeParameter('backgroundColor', itemIndex, '') as string;
	const format: string = context.getNodeParameter('format', itemIndex) as string;

	// Check if binary data exists (only if resource is DATA)
	let binaryDataBuffer = null;
	let fileName = 'image.png';
	let mimeType = 'image/png';
	
	if (resource === 'DATA') {
		if (!inputBinaryField) {
			throw new NodeOperationError(
				context.getNode(),
				'Input Binary Field is required when using Binary Image resource',
				{ itemIndex }
			);
		}
		try {
			// Get binary data metadata using assertBinaryData
			const binaryData = context.helpers.assertBinaryData(itemIndex, inputBinaryField);
			binaryDataBuffer = await context.helpers.getBinaryDataBuffer(itemIndex, inputBinaryField);
			fileName = binaryData.fileName || (binaryData.fileExtension ? `image.${binaryData.fileExtension}` : 'image.png');
			mimeType = binaryData.mimeType || 'image/png';
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Binary data not found in field "${inputBinaryField}". Please ensure the previous node provides binary data.`,
				{ itemIndex }
			);
		}
	} else if (resource === 'Image URL') {
		if (!imageUrl) {
			throw new NodeOperationError(
				context.getNode(),
				'Image URL is required when using Image URL resource',
				{ itemIndex }
			);
		}
	}

	// Prepare form data for background removal (manual multipart - no form-data package)
	const formFields: Record<string, string | { data: any; filename?: string; contentType?: string }> = {};

	if (binaryDataBuffer) {
		// Send binary file
		formFields.image = {
			data: binaryDataBuffer,
			filename: fileName,
			contentType: mimeType,
		};
		formFields.size = 'auto';
	} else {
		// Send image URL (only when no binary data)
		formFields.image_url = imageUrl;
	}

	if (bgImageUrl) {
		formFields.bg_image_url = bgImageUrl;
	}

	if (bgColor) {
		formFields.bg_color = bgColor;
	}

	if (format) {
		formFields.format = format;
	}

	const multipart = buildMultipartFormData(formFields);
	let result = null;
	let imageBuffer = null;
	try {
		// Call Picsart API to remove background
		result = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://api.picsart.io/tools/1.0/removebg',
				headers: {
					Accept: 'application/json',
					'Content-Type': multipart.contentType,
				},
				body: multipart.body,
			},
		);
		// Download the processed image
		imageBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: result?.data?.url,
			encoding: 'arraybuffer',
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}

	// Return processed image data
	returnData.push({
		binary: {
			data: await context.helpers.prepareBinaryData(imageBuffer, 'result.png'),
		},
		json: {
			imageUrl: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
			result,
		},
	});
}

async function executeEnhance(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get resource type
	const resource: string = context.getNodeParameter('resource', itemIndex) as string;
	
	// Get parameters
	const inputBinaryField: string = context.getNodeParameter('inputBinaryField', itemIndex, '') as string;
	const imageUrl: string = context.getNodeParameter('image_url', itemIndex, '') as string;
	const upscaleFactor: string = context.getNodeParameter('upscale_factor', itemIndex) as string;
	const format: string = context.getNodeParameter('format', itemIndex) as string;

	// Check if binary data exists (only if resource is DATA)
	let binaryDataBuffer = null;
	let fileName = 'image.png';
	let mimeType = 'image/png';
	if (resource === 'DATA') {
		if (!inputBinaryField) {
			throw new NodeOperationError(
				context.getNode(),
				'Input Binary Field is required when using Binary Image resource',
				{ itemIndex }
			);
		}
		try {
			// Get binary data metadata using assertBinaryData
			const binaryData = context.helpers.assertBinaryData(itemIndex, inputBinaryField);
			binaryDataBuffer = await context.helpers.getBinaryDataBuffer(itemIndex, inputBinaryField);
			fileName = binaryData.fileName || (binaryData.fileExtension ? `image.${binaryData.fileExtension}` : 'image.png');
			mimeType = binaryData.mimeType || 'image/png';
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Binary data not found in field "${inputBinaryField}". Please ensure the previous node provides binary data.`,
				{ itemIndex }
			);
		}
	} else if (resource === 'Image URL') {
		if (!imageUrl) {
			throw new NodeOperationError(
				context.getNode(),
				'Image URL is required when using Image URL resource',
				{ itemIndex }
			);
		}
	}

	// If using URL, validate it
	if (!binaryDataBuffer && imageUrl) {
		if (!imageUrl || imageUrl.length < 1 || imageUrl.length > 2083) {
			throw new NodeOperationError(
				context.getNode(),
				'image_url is required and must be 1..2083 chars',
				{ itemIndex },
			);
		}

		try {
			// Basic URI validation
			// eslint-disable-next-line no-new
			new URL(imageUrl);
		} catch (_) {
			throw new NodeOperationError(context.getNode(), 'image_url must be a valid URL', {
				itemIndex,
			});
		}
	}

	// format validation (default JPG; allowed: JPG, PNG, WEBP)
	const allowedFormats = ['JPG', 'PNG', 'WEBP'];
	const normalizedFormat = (format || 'JPG').toUpperCase();

	if (!allowedFormats.includes(normalizedFormat)) {
		throw new NodeOperationError(context.getNode(), 'format must be one of: JPG, PNG, WEBP', {
			itemIndex,
		});
	}

	// image_url extension validation (only if using URL)
	if (!binaryDataBuffer && imageUrl) {
		try {
			const urlObj = new URL(imageUrl);
			const pathname = urlObj.pathname || '';
			const extRaw = pathname.split('.').pop() || '';
			const ext = extRaw.toLowerCase();
			const extMap: Record<string, 'JPG' | 'PNG' | 'WEBP'> = {
				jpg: 'JPG',
				jpeg: 'JPG',
				png: 'PNG',
				webp: 'WEBP',
			};
			if (ext && !Object.keys(extMap).includes(ext)) {
				throw new NodeOperationError(
					context.getNode(),
					'image_url must point to JPG, PNG, or WEBP',
					{ itemIndex },
				);
			}
			const urlFormat = ext ? extMap[ext] : undefined;
			if (urlFormat && urlFormat !== normalizedFormat) {
				throw new NodeOperationError(
					context.getNode(),
					`format (${normalizedFormat}) must match image_url extension (${urlFormat})`,
					{ itemIndex },
				);
			}
		} catch (_) {
			// URL already validated above; ignore parse edge cases here
			throw new NodeOperationError(
				context.getNode(),
				'image_url must point to JPG, PNG, or WEBP',
				{ itemIndex },
			);
		}
	}

	let result = null;
	let imageBuffer = null;

	// Prepare form data for upscaling (manual multipart - no form-data package)
	const formFields: Record<string, string | { data: any; filename?: string; contentType?: string }> = {
		upscale_factor: upscaleFactor,
		format: normalizedFormat,
	};

	if (binaryDataBuffer) {
		// Send binary file
		formFields.image = {
			data: binaryDataBuffer,
			filename: fileName,
			contentType: mimeType,
		};
	} else {
		// Send image URL (only when no binary data)
		formFields.image_url = imageUrl;
	}

	const multipart = buildMultipartFormData(formFields);
	try {
		// Call Picsart API to enhance/upscale image
		result = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://api.picsart.io/tools/1.0/upscale',
				headers: {
					Accept: 'application/json',
					'Content-Type': multipart.contentType,
				},
				body: multipart.body,
			},
		);

		// Download the processed image
		imageBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: result?.data?.url,
			encoding: 'arraybuffer',
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}

	// Return processed image data
	returnData.push({
		binary: {
			data: await context.helpers.prepareBinaryData(imageBuffer, 'result.png'),
		},
		json: {
			imageUrl: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
			result,
		},
	});
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
	const count: number = context.getNodeParameter('count', itemIndex, 1) as number;
	// Polling configuration (hardcoded, not exposed to user)
	const maxPollAttempts: number = 150; // maximum attempts (up to 5 minutes with 2s delay)
	const pollDelayMs: number = 2000; // 2 seconds between polls

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

	// Validate count
	if (count < 1 || count > 10) {
		throw new NodeOperationError(
			context.getNode(),
			'Count must be between 1 and 10',
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
					count,
					model: 'urn:air:sdxl:model:fluxai:flux_kontext_max@1',
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
		// GET https://genai-api.picsart.io/v1/text2image/inferences/{transaction_id}
		let pollAttempts = 0;
		let imageUrls: string[] = [];

		while (pollAttempts < maxPollAttempts) {
			// Add delay between polling attempts (skip first attempt)
			if (pollAttempts > 0) {
				await new Promise(resolve => setTimeout(resolve, pollDelayMs));
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
						// Extract all image URLs from the array (up to count)
						imageUrls = result.data
							.slice(0, count)
							.map((item: any) => item.url)
							.filter((url: string) => url);
						if (imageUrls.length > 0) {
							break;
						}
					}
					// Fallback: handle data as object with url property
					else if (result.data?.url) {
						imageUrls = [result.data.url];
						if (imageUrls.length > 0) {
							break;
						}
					}
					// Fallback: direct url property
					else if (result.url) {
						imageUrls = [result.url];
						if (imageUrls.length > 0) {
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

		if (imageUrls.length === 0) {
			const timeoutMinutes = Math.floor((maxPollAttempts * pollDelayMs) / 60000);
			throw new NodeOperationError(
				context.getNode(),
				`Image generation timed out after ${maxPollAttempts} attempts (~${timeoutMinutes} minutes). Transaction ID: ${transactionId}. Last response: ${JSON.stringify(result)}`,
				{ itemIndex }
			);
		}

		// Step 3: Download all generated images and return them
		for (let i = 0; i < imageUrls.length; i++) {
			const imageUrl = imageUrls[i];
			const imageBuffer = await context.helpers.httpRequest({
				method: 'GET',
				url: imageUrl,
				encoding: 'arraybuffer',
			});

			// Return each generated image as a separate item
			returnData.push({
				binary: {
					data: await context.helpers.prepareBinaryData(imageBuffer, `generated-image-${i + 1}.png`),
				},
				json: {
					prompt,
					width,
					height,
					count: imageUrls.length,
					imageIndex: i + 1,
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

function handleApiError(context: IExecuteFunctions, error: any, itemIndex: number): void {
		const statusCode = error.response?.status || error.statusCode || error.httpCode;
		const errorMessage =
			error.context?.data?.detail ||
			error.response?.data?.detail ||
			error.response?.data?.message ||
			error.context?.data?.message ||
			error.message;

		if (statusCode === 429) {
			// Rate limit exceeded - user has insufficient credits
			throw new NodeOperationError(
				context.getNode(),
				`Insufficient credits or rate limit exceeded. Please check your Picsart account balance. ${errorMessage || ''}`,
				{ itemIndex }
			);
		} else if (statusCode === 401 || statusCode === 403) {
			// Authentication/Authorization error
			throw new NodeOperationError(
				context.getNode(),
				`Authentication failed. Please check your API key is valid. ${errorMessage || ''}`,
				{ itemIndex }
			);
		} else if (statusCode >= 400 && statusCode < 500) {
			// Client error (400-499) - user's fault
			throw new NodeOperationError(
				context.getNode(),
				`Client error: ${errorMessage || 'Invalid request parameters. Please check your input data.'}`,
				{ itemIndex }
			);
		} else if (statusCode >= 500) {
			// Server error (500-599) - Picsart API issue
			throw new NodeOperationError(
				context.getNode(),
				`Picsart API server error (${statusCode}). Please try again later. ${errorMessage || ''}`,
				{ itemIndex }
			);
		} else {
			// Unknown error
			throw new NodeOperationError(
				context.getNode(),
				`Failed to process image: ${errorMessage || error.message}`,
				{ itemIndex }
			);
		}
}

