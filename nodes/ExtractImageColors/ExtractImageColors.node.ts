import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { extractColorsProperties } from './properties/extractColorsProperties';
import { executeExtractColors } from './execute/executeExtractColors';

export class ExtractImageColors implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Extract Image Colors',
		name: 'extractImageColors',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description:
			'Extract the key colors from an image to understand its visual style and palette. Returns up to five prominent colors, including dominant foreground and background tones.',
		subtitle: '={{ $parameter["resource"] }}',
		defaults: {
			name: 'Picsart Extract Image Colors',
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
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Binary Image', value: 'DATA' },
					{ name: 'Image URL', value: 'Image URL' },
				],
				default: 'Image URL',
			},
			...extractColorsProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				await executeExtractColors(this, itemIndex, returnData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: items[itemIndex].json, error, pairedItem: itemIndex });
				} else {
					if (error instanceof NodeOperationError) throw error;
					throw new NodeOperationError(this.getNode(), (error as Error).message, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}
