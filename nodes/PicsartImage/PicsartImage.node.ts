import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import FormData from 'form-data';

import { enhanceProperties } from './enhanceProperties';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { removeBgProperties } from './removeBgProperties';

export class PicsartImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart',
		name: 'picsartImage',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description: 'Process images with Picsart API: remove backgrounds and enhance images',
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		defaults: {
			name: 'Picsart Image',
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Binary Image',
						value: 'binaryImage',
					},
					{
						name: 'Image URL',
						value: 'imageUrl',
					},
				],
				default: 'binaryImage',

			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['binaryImage', 'imageUrl'],
					},
				},
				options: [
					{
						name: 'Remove Background',
						value: 'removeBackground',
						action: 'Remove background from an image',
						description: 'Remove background from an image',
					},
					{
						name: 'Enhance',
						value: 'enhance',
						action: 'Enhance an image',
						description: 'Enhance and upscale an image',
					},
				],
				default: 'removeBackground',
			},
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

				if (operation === 'removeBackground') {
					await executeRemoveBackground(this, itemIndex, returnData);
				} else if (operation === 'enhance') {
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
	const bgImageUrl: string = context.getNodeParameter('bg_image_url', itemIndex, '') as string;
	const bgColor: string = context.getNodeParameter('bg_color', itemIndex, '') as string;
	const format: string = context.getNodeParameter('format', itemIndex) as string;

	// Check if binary data exists (only if resource is binaryImage)
	let binaryDataBuffer = null;
	let fileName = 'image.png';
	let mimeType = 'image/png';

	if (resource === 'binaryImage') {
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
	} else if (resource === 'imageUrl') {
		if (!imageUrl) {
			throw new NodeOperationError(
				context.getNode(),
				'Image URL is required when using Image URL resource',
				{ itemIndex }
			);
		}
	}

	// Prepare form data for background removal
	const formData = new FormData();

	if (binaryDataBuffer) {
		// Send binary file - use 'image' as the field name (matching browser code)
		// form-data package will properly format this as a file upload
		formData.append('image', binaryDataBuffer, {
			filename: fileName,
			contentType: mimeType,
		});
		// Add "size" parameter like in the browser example
		formData.append('size', 'auto');
	} else {
		// Send image URL (only when no binary data)
		formData.append('image_url', imageUrl);
	}

	if (bgImageUrl) {
		formData.append('bg_image_url', bgImageUrl);
	}

	if (bgColor) {
		formData.append('bg_color', bgColor);
	}

	if (format) {
		formData.append('format', format);
	}

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
					// form-data package sets Content-Type with boundary automatically
					...formData.getHeaders(),
				},
				body: formData,
			},
		);

		// Download the processed image
		imageBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: result?.data?.url,
			encoding: 'arraybuffer',
		});
	} catch (error: any) {
		// Log full error details for debugging
		console.log('=== FULL ERROR OBJECT ===');
		console.log('Error context.data:', error.context?.data);
		console.log('========================');
		
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

	// Check if binary data exists (only if resource is binaryImage)
	let binaryDataBuffer = null;
	let fileName = 'image.png';
	let mimeType = 'image/png';

	if (resource === 'binaryImage') {
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
	} else if (resource === 'imageUrl') {
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

	// Prepare form data for upscaling
	const formData = new FormData();
	formData.append('upscale_factor', upscaleFactor);
	formData.append('format', normalizedFormat);

	if (binaryDataBuffer) {
		// Send binary file
		formData.append('image', binaryDataBuffer, {
			filename: fileName,
			contentType: mimeType,
		});
	} else {
		// Send image URL (only when no binary data)
		formData.append('image_url', imageUrl);
	}

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
					// form-data package sets Content-Type with boundary automatically
					...formData.getHeaders(),
				},
				body: formData,
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
