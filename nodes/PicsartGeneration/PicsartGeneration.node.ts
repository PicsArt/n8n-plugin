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
import { image2VideoProperties } from './properties/image2VideoProperties';
import { text2VideoProperties } from './properties/text2VideoProperties';
import { text2SpeechProperties } from './properties/text2SpeechProperties';
import { text2SoundProperties } from './properties/text2SoundProperties';
import { paintingEditProperties } from './properties/paintingEditProperties';
import { executeText2Image } from './execute/executeText2Image';
import { executeText2Sticker } from './execute/executeText2Sticker';
import { executeText2Video } from './execute/executeText2Video';
import { executeText2Speech } from './execute/executeText2Speech';
import { executeText2Sound } from './execute/executeText2Sound';
import { executeImage2Video } from './execute/executeImage2Video';
import { executePaintingEdit } from './execute/executePaintingEdit';

export class PicsartGeneration implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Generative AI-Hub',
		name: 'picsartGeneration',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description:
			'Generate and edit media with Picsart GenAI API: images, stickers, sound, video, and prompt-based image editing.',
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
					name: 'Edit Image With Prompt',
					value: 'Edit Image with Prompt',
					action: 'Edit an image using a text prompt',
					description: 'Edit or transform a source image with an AI model using a text prompt',
				},
				{
					name: 'Generate Images from Prompt',
					value: 'text2Image',
					action: 'Generate an image from text prompt',
					description: 'Generate an image from a text prompt using AI',
				},
				{
					name: 'Generate Music/Sound from Prompt',
					value: 'Generate Music/Sound from Prompt',
					action: 'Generate music or sound from a text prompt',
					description: 'Generate music or sound effects from a text prompt using AI',
				},
				{
					name: 'Generate Speech from Prompt',
					value: 'Generate Speech from Prompt',
					action: 'Generate speech audio from text',
					description: 'Generate spoken audio from input text using AI text-to-speech',
				},
				{
					name: 'Generate Stickers from Prompt',
					value: 'text2Sticker',
					action: 'Generate a sticker from text prompt',
					description: 'Generate a sticker from a text prompt using AI',
				},
				{
					name: 'Generate Video from Prompt',
					value: 'Generate Video from Prompt',
					action: 'Generate a video from a text prompt',
					description:
						'Generate one video per request from a text prompt only. Output duration, resolution, and audio depend on the selected model.',
				},
				{
					name: 'Generate Video from Prompt and Image',
					value: 'Generate Video from Prompt and Image',
					action: 'Generate a video from an image and text prompt',
					description:
						'Generate one video per request from a source image and prompt. Output duration, resolution, and audio depend on the selected model.',
				},
			],
				default: 'text2Image',
			},
		// Text2Image Operation Parameters
		...text2ImageProperties,
		// Text2Sticker Operation Parameters
		...text2StickerProperties,
		// Image2Video Operation Parameters
		...image2VideoProperties,
		// Text2Video Operation Parameters
		...text2VideoProperties,
		// Text2Speech Operation Parameters
		...text2SpeechProperties,
		// Text2Sound Operation Parameters
		...text2SoundProperties,
		// Painting edit (image with prompt) parameters
		...paintingEditProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items: INodeExecutionData[] = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get operation
				const operation: string = this.getNodeParameter('operation', itemIndex) as string;
				if (operation === 'Edit Image with Prompt') {
					await executePaintingEdit(this, itemIndex, returnData);
				} else if (operation === 'text2Image' || operation === 'Generate Images from Prompt') {
					await executeText2Image(this, itemIndex, returnData);
				} else if (operation === 'Generate Music/Sound from Prompt') {
					await executeText2Sound(this, itemIndex, returnData);
				} else if (operation === 'Generate Speech from Prompt') {
					await executeText2Speech(this, itemIndex, returnData);
				} else if (operation === 'text2Sticker' || operation === 'Generate Stickers from Prompt') {
					await executeText2Sticker(this, itemIndex, returnData);
				} else if (operation === 'Generate Video from Prompt and Image') {
					await executeImage2Video(this, itemIndex, returnData);
				} else if (operation === 'Generate Video from Prompt') {
					await executeText2Video(this, itemIndex, returnData);
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
