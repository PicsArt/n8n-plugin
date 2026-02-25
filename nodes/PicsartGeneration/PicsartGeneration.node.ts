import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { text2ImageProperties } from './properties/text2ImageProperties';
import { text2StickerProperties } from './properties/text2StickerProperties';
import { executeText2Image } from './execute/executeText2Image';
import { executeText2Sticker } from './execute/executeText2Sticker';

export class PicsartGeneration implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Generative AI-Hub',
		name: 'picsartGeneration',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description: 'Generate images and stickers with Picsart API: generate from prompt',
		subtitle: '={{ $parameter["operation"] }}',
		defaults: {
			name: 'Picsart Generative AI-Hub',
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
					name: 'text2Image',
					value: 'text2Image',
					action: 'Generate an image from text prompt',
					description: 'Generate an image from a text prompt using AI',
				},
				{
					name: 'text2Sticker',
					value: 'text2Sticker',
					action: 'Generate a sticker from text prompt',
					description: 'Generate a sticker from a text prompt using AI',
				},
			],
				default: 'text2Image',
			},
		// Text2Image Operation Parameters
		...text2ImageProperties,
		// Text2Sticker Operation Parameters
		...text2StickerProperties,
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
                } else if (operation === 'text2Sticker') {
                    await executeText2Sticker(this, itemIndex, returnData);
                } else { // This should never happen
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
