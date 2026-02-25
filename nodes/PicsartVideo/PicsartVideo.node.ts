import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { watermarkProperties } from './properties/watermarkProperties';
import { trimProperties } from './properties/trimProperties';
import { compressVideoProperties } from './properties/compressVideoProperties';
import { videoToGifProperties } from './properties/videoToGifProperties';
import { videoHighlightsProperties } from './properties/videoHighlightsProperties';
import { cropProperties } from './properties/cropProperties';
import { fitProperties } from './properties/fitProperties';
import { ctvEncodeProperties } from './properties/ctvEncodeProperties';
import { muteVideoProperties } from './properties/muteVideoProperties';
import { videoEffectsProperties } from './properties/videoEffectsProperties';
import { fpsUpscaleProperties } from './properties/fpsUpscaleProperties';
import { executeWatermark } from './execute/executeWatermart';
import { executeTrim } from './execute/executeTrim';
import { executeCompressVideo } from './execute/executeCompressVideo';
import { executeVideoToGif } from './execute/executeVideoToGif';
import { executeVideoHighlights } from './execute/executeVideoHighlights';
import { executeCrop } from './execute/executeCrop';
import { executeFit } from './execute/executeFit';
import { executeCtvEncode } from './execute/executeCtvEncode';
import { executeMuteVideo } from './execute/executeMuteVideo';
import { executeVideoEffects } from './execute/executeVideoEffects';
import { executeFpsUpscale } from './execute/executeFpsUpscale';

export class PicsartVideo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart',
		name: 'picsartVideo',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description: 'Generate images and stickers with Picsart API: generate from prompt',
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Video',
						value: 'video',
					},
				],
				default: 'video',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['video'],
					},
				},
				options: [
					{
						name: 'Add Watermark',
						value: 'Add Watermark',
						action: 'Add watermark to video',
						description: 'Add a watermark image to your video',
					},
					{
						name: 'Clip a Video',
						value: 'Clip a Video',
						action: 'Clip a video',
						description: 'Trim the video to a specific segment (start/end in milliseconds)',
					},
					{
						name: 'Compress Video to Size',
						value: 'Compress video to size',
						action: 'Compress video to size',
						description: 'Reduce your video file to a specific size in MB without losing quality',
					},
					{
						name: 'Crop Video',
						value: 'Crop Video',
						action: 'Crop video to desired size',
						description: 'Crop the video to width/height with optional start position',
					},
					{
						name: 'Fit Video',
						value: 'Fit Video',
						action: 'Fit video to ratio or dimensions',
						description: 'Fit video to different ratios or width/height; optional background',
					},
					{
						name: 'Make Video CTV-Compatible',
						value: 'Make Video CTV-Compatible',
						action: 'Make video ctv compatible',
						description: 'Convert video to meet CTV (Connected TV) requirements',
					},
					{
						name: 'Mute Video',
						value: 'Mute Video',
						action: 'Mute video audio',
						description: 'Set video volume to 0 (mute) or keep original volume',
					},
					{
						name: 'Video Filters and Effects',
						value: 'Video Filters and Effects',
						action: 'Apply effect or filter to video',
						description: 'Apply one of 24+ effects (e.g. vignette, sharpen, noise) to a video',
					},
					{
						name: 'Video FPS Upscale',
						value: 'Video FPS Upscale',
						action: 'Upscale video to 60 FPS',
						description: 'Upscale low FPS video to 60 FPS using Generative AI',
					},
					{
						name: 'Video Highlights',
						value: 'Video Highlights',
						action: 'Create highlights video',
						description: 'Pick segments from a video and concatenate them into one output',
					},
					{
						name: 'Video to GIF',
						value: 'Video to GIF',
						action: 'Convert video to GIF',
						description: 'Convert video to GIF (format GIF)',
					},
				],
				default: 'Add Watermark',
			},

		// Watermark Operation Parameters
		...watermarkProperties,
		// Trim Video Operation Parameters
		...trimProperties,
		// Compress video to size Operation Parameters
		...compressVideoProperties,
		// Video to GIF Operation Parameters
		...videoToGifProperties,
		// Video Highlights Operation Parameters
		...videoHighlightsProperties,
		// Crop Video Operation Parameters
		...cropProperties,
		// Fit Video Operation Parameters
		...fitProperties,
		// Make Video CTV-Compatible Operation Parameters
		...ctvEncodeProperties,
		// Mute Video Operation Parameters
		...muteVideoProperties,
		// Video Filters and Effects Operation Parameters
		...videoEffectsProperties,
		// Video FPS Upscale Operation Parameters
		...fpsUpscaleProperties,
		{
			displayName: 'Mode',
			name: 'mode',
			type: 'options',
			options: [
			  { name: 'Simple', value: 'simple' },
			  { name: 'Advanced', value: 'advanced' },
			],
			default: 'simple',
		},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items: INodeExecutionData[] = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {

				// Get operation
				const operation: string = this.getNodeParameter('operation', itemIndex) as string;
                if (operation === 'Add Watermark') {
                    await executeWatermark(this, itemIndex, returnData);
                } else if (operation === 'Clip a Video') {
                    await executeTrim(this, itemIndex, returnData);
                } else if (operation === 'Compress video to size') {
                    await executeCompressVideo(this, itemIndex, returnData);
                } else if (operation === 'Video to GIF') {
                    await executeVideoToGif(this, itemIndex, returnData);
                } else if (operation === 'Video Highlights') {
                    await executeVideoHighlights(this, itemIndex, returnData);
                } else if (operation === 'Crop Video') {
                    await executeCrop(this, itemIndex, returnData);
                } else if (operation === 'Fit Video') {
                    await executeFit(this, itemIndex, returnData);
                } else if (operation === 'Make Video CTV-Compatible') {
                    await executeCtvEncode(this, itemIndex, returnData);
                } else if (operation === 'Mute Video') {
                    await executeMuteVideo(this, itemIndex, returnData);
                } else if (operation === 'Video Filters and Effects') {
                    await executeVideoEffects(this, itemIndex, returnData);
                } else if (operation === 'Video FPS Upscale') {
                    await executeFpsUpscale(this, itemIndex, returnData);
                } else {
                    // This should never happen
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
