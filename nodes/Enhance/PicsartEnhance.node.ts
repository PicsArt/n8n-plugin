import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class PicsartEnhance implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Enhance',
		name: 'picsartEnhance',
		icon: 'file:../icons/image2vector.svg',
		group: ['transform'],
		version: 1,
		description: 'Node to enhance image with upscale factor',
		defaults: {
			name: 'Picsart Enhance',
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
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Image URL',
				name: 'image_url',
				type: 'string',
				default: '',
				placeholder: '{{$json["image_url"]}}',
				description: 'URL image for processing',
			},
			{
				displayName: 'Upscale Factor',
				name: 'upscale_factor',
				type: 'options',
				default: '2',
				options: [
					{ name: '2x', value: '2' },
					{ name: '4x', value: '4' },
					{ name: '6x', value: '6' },
					{ name: '8x', value: '8' },
				],
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				default: 'PNG',
				noDataExpression: true,
				options: [
					{ name: 'JPG', value: 'JPG' },
					{ name: 'PNG', value: 'PNG' },
					{ name: 'WEBP', value: 'WEBP' },
				],
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items: INodeExecutionData[] = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const credentials = await this.getCredentials('picsartApi');
				const imageUrl: string = this.getNodeParameter('image_url', itemIndex) as string;
				const apiKey: string = credentials.apiKey as string;
				const upscaleFactor: string = this.getNodeParameter('upscale_factor', itemIndex) as string;
				const format: string = this.getNodeParameter('format', itemIndex) as string;

				if (!apiKey) {
					throw new NodeOperationError(this.getNode(), 'API key is required', { itemIndex });
				}

				if (!imageUrl || imageUrl.length < 1 || imageUrl.length > 2083) {
					throw new NodeOperationError(
						this.getNode(),
						'image_url is required and must be 1..2083 chars',
						{ itemIndex },
					);
				}
				try {
					// Basic URI validation
					// eslint-disable-next-line no-new
					new URL(imageUrl);
				} catch (_) {
					throw new NodeOperationError(this.getNode(), 'image_url must be a valid URL', {
						itemIndex,
					});
				}

				// format validation (default JPG; allowed: JPG, PNG, WEBP)
				const allowedFormats = ['JPG', 'PNG', 'WEBP'];
				const normalizedFormat = (format || 'JPG').toUpperCase();

				if (!allowedFormats.includes(normalizedFormat)) {
					throw new NodeOperationError(this.getNode(), 'format must be one of: JPG, PNG, WEBP', {
						itemIndex,
					});
				}

				// image_url extension validation (must be JPG/PNG/WEBP) and align with selected format when present
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
							this.getNode(),
							'image_url must point to JPG, PNG, or WEBP',
							{ itemIndex },
						);
					}
					const urlFormat = ext ? extMap[ext] : undefined;
					if (urlFormat && urlFormat !== normalizedFormat) {
						throw new NodeOperationError(
							this.getNode(),
							`format (${normalizedFormat}) must match image_url extension (${urlFormat})`,
							{ itemIndex },
						);
					}
				} catch (_) {
					// URL already validated above; ignore parse edge cases here
					throw new NodeOperationError(
						this.getNode(),
						'image_url must point to JPG, PNG, or WEBP',
						{ itemIndex },
					);
				}

				let result = null;
				let imageBuffer = null;

				// Prepare form data for upscaling
				const formData: FormData = new FormData();
				formData.append('upscale_factor', upscaleFactor);
				formData.append('format', normalizedFormat);
				formData.append('image_url', imageUrl);

				try {
					// Call Picsart API to enhance/upscale image
					result = await this.helpers.httpRequest({
						method: 'POST',
						url: 'https://api.picsart.io/tools/1.0/upscale',
						headers: {
							'x-picsart-api-key': apiKey,
							Accept: 'application/json',
						},
						body: formData,
					});

					// Download the processed image
					imageBuffer = await this.helpers.httpRequest({
						method: 'GET',
						url: result?.data?.url,
						encoding: 'arraybuffer',
					});
				} catch (error: any) {
					// Handle different HTTP error codes
					const statusCode = error.response?.status || error.statusCode;
					const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;

					if (statusCode === 429) {
						// Rate limit exceeded - user has insufficient credits
						throw new NodeOperationError(
							this.getNode(),
							`Insufficient credits or rate limit exceeded. Please check your Picsart account balance. ${errorMessage || ''}`,
							{ itemIndex }
						);
					} else if (statusCode === 401 || statusCode === 403) {
						// Authentication/Authorization error
						throw new NodeOperationError(
							this.getNode(),
							`Authentication failed. Please check your API key is valid. ${errorMessage || ''}`,
							{ itemIndex }
						);
					} else if (statusCode >= 400 && statusCode < 500) {
						// Client error (400-499) - user's fault
						throw new NodeOperationError(
							this.getNode(),
							`Client error: ${errorMessage || 'Invalid request parameters. Please check your input data.'}`,
							{ itemIndex }
						);
					} else if (statusCode >= 500) {
						// Server error (500-599) - Picsart API issue
						throw new NodeOperationError(
							this.getNode(),
							`Picsart API server error (${statusCode}). Please try again later. ${errorMessage || ''}`,
							{ itemIndex }
						);
					} else {
						// Unknown error
						throw new NodeOperationError(
							this.getNode(),
							`Failed to process image: ${errorMessage || error.message}`,
							{ itemIndex }
						);
					}
				}

				// Return processed image data
				returnData.push({
					binary: {
						data: await this.helpers.prepareBinaryData(imageBuffer, 'result.png'),
					},
					json: {
						imageUrl,
						result,
					},
				});
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