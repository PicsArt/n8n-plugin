import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class PicsartRemoveBackground implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Remove Background',
		name: 'picsartRemoveBackground',
		icon: 'file:../icons/image2vector.svg',
		group: ['transform'],
		version: 1,
		description: 'Node to remove background from image',
		defaults: {
			name: 'Picsart Remove Background',
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
				displayName: 'Output Type',
				name: 'output_type',
				type: 'options',
				default: 'cutout',
				noDataExpression: true,
				options: [
					{ name: 'Cutout', value: 'cutout' },
					{ name: 'Mask', value: 'mask' },
				],
			},
			{
				displayName: 'Bg Image URL',
				name: 'bg_image_url',
				type: 'string',
				default: '',
				description: 'Background image URL',
			},
			{
				displayName: 'Bg Color',
				name: 'bg_color',
				type: 'color',
				default: '',
				description: 'Background color',
			},
			{
				displayName: 'Bg Blur',
				name: 'bg_blur',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
				description: 'Background blur',
			},
			{
				displayName: 'Bg Width',
				name: 'bg_width',
				type: 'number',
				default: '',
				description: 'Width',
			},
			{
				displayName: 'Bg Height',
				name: 'bg_height',
				type: 'number',
				default: '',
				description: 'Height',
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'options',
				default: 'fit',
				noDataExpression: true,
				options: [
					{ name: 'Fit', value: 'fit' },
					{ name: 'Fill', value: 'fill' },
				],
			},
			{
				displayName: 'Auto Center',
				name: 'auto_center',
				type: 'options',
				default: 'false',
				noDataExpression: true,
				options: [
					{ name: 'Fasle', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Stroke Size',
				name: 'stroke_size',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
			},
			{
				displayName: 'Stroke Color',
				name: 'stroke_color',
				type: 'color',
				default: 'FFFFFF',
			},
			{
				displayName: 'Stroke Opacity',
				name: 'stroke_opacity',
				type: 'number',
				default: 100,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
			},
			{
				displayName: 'Shadow',
				name: 'shadow',
				type: 'options',
				default: 'disabled',
				noDataExpression: true,
				options: [
					{ name: 'Bottom', value: 'bottom' },
					{ name: 'bottom-left', value: 'bottom-left' },
					{ name: 'bottom-right', value: 'bottom-right' },
					{ name: 'Custom', value: 'custom' },
					{ name: 'Disabled', value: 'disabled' },
					{ name: 'Left', value: 'left' },
					{ name: 'Right', value: 'right' },
					{ name: 'Top', value: 'top' },
					{ name: 'top-left', value: 'top-left' },
					{ name: 'top-right', value: 'top-right' },
				],
			},
			{
				displayName: 'Shadow Opacity',
				name: 'shadow_opacity',
				type: 'number',
				default: 20,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
			},
			{
				displayName: 'Shadow Blur',
				name: 'shadow_blur',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
			},
			{
				displayName: 'Shadow Offset X',
				name: 'shadow_offset_x',
				type: 'number',
				default: '',
				typeOptions: {
					minValue: -100,
					maxValue: 100,
				},
			},
			{
				displayName: 'Shadow Offset Y',
				name: 'shadow_offset_y',
				type: 'number',
				default: '',
				typeOptions: {
					minValue: -100,
					maxValue: 100,
				},
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

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get credentials and parameters
				const credentials = await this.getCredentials('picsartApi');
				const apiKey: string = credentials.apiKey as string;
				const bgColor: string = this.getNodeParameter('bg_color', itemIndex) as string;
				const imageUrl: string = this.getNodeParameter('image_url', itemIndex) as string;
				const outputType: string = this.getNodeParameter('output_type', itemIndex) as string;
				const bgBlur: string = this.getNodeParameter('bg_blur', itemIndex) as string;
				const scale: string = this.getNodeParameter('scale', itemIndex) as string;
				const autoCenter: string = this.getNodeParameter('auto_center', itemIndex) as string;
				const strokeSize: string = this.getNodeParameter('stroke_size', itemIndex) as string;
				const strokeColor: string = this.getNodeParameter('stroke_color', itemIndex) as string;
				const strokeOpacity: string = this.getNodeParameter('stroke_opacity', itemIndex) as string;
				const shadow: string = this.getNodeParameter('shadow', itemIndex) as string;
				const shadowOpacity: string = this.getNodeParameter('shadow_opacity', itemIndex) as string;
				const shadowBlur: string = this.getNodeParameter('shadow_blur', itemIndex) as string;
				const format: string = this.getNodeParameter('format', itemIndex) as string;

				if (!apiKey) {
					throw new NodeOperationError(this.getNode(), 'API key is required', { itemIndex });
				}

				if (!imageUrl) {
					throw new NodeOperationError(this.getNode(), 'Image URL is required', { itemIndex });
				}

				// Prepare form data for background removal
				const formData: FormData = new FormData();
				formData.append('image_url', imageUrl);
				formData.append('bg_color', bgColor);
				formData.append('output_type', outputType);
				formData.append('bg_blur', bgBlur);
				formData.append('scale', scale);
				formData.append('auto_center', autoCenter);
				formData.append('stroke_size', strokeSize);
				formData.append('stroke_color', strokeColor);
				formData.append('stroke_opacity', strokeOpacity);
				formData.append('shadow', shadow);
				formData.append('shadow_opacity', shadowOpacity);
				formData.append('shadow_blur', shadowBlur);
				formData.append('format', format);

			let result = null;
			let imageBuffer = null;
			try {
					// Call Picsart API to remove background
					result = await this.helpers.httpRequest({
						method: 'POST',
						url: 'https://api.picsart.io/tools/1.0/removebg',
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
