import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { enhanceProperties } from './properties/enhanceProperties';
import { removeBgProperties } from './properties/removeBgProperties';
import { text2ImageProperties } from './properties/text2ImageProperties';
import { ultraUpscaleProperties } from './properties/ultraUpscaleProperties';
import { executeRemoveBackground } from './execute/executeRemoveBackground';
import { executeEnhance } from './execute/executeEnhance';
import { executeUltraUpscale } from './execute/executeUltraUpscale';
import { executeText2Image } from './execute/executeText2Image';

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
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
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
						name: 'Ultra Upscale',
						value: 'Ultra Upscale',
						action: 'Ultra upscale an image up to 16x',
						description: 'Ultra upscale an image with advanced AI (2x-16x)',
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
			// Ultra Upscale Operation Parameters
            ...ultraUpscaleProperties,
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
				} else if (operation === 'Ultra Upscale') {
					await executeUltraUpscale(this, itemIndex, returnData);
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
