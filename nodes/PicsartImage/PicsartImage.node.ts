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
import { carClassifyProperties } from './properties/carClassifyProperties';
import { describeImageProperties } from './properties/describeImageProperties';
import { hashtagProperties } from './properties/hashtagProperties';
import { convertPngToJpgProperties } from './properties/convertPngToJpgProperties';
import { convertPngToWebpProperties } from './properties/convertPngToWebpProperties';
import { cropImageProperties } from './properties/cropImageProperties';
import { resizeImageProperties } from './properties/resizeImageProperties';
import { watermarkProperties } from './properties/watermarkProperties';
import { ultraUpscaleProperties } from './properties/ultraUpscaleProperties';
import { ultraEnhanceProperties } from './properties/ultraEnhanceProperties';
import { faceEnhanceProperties } from './properties/faceEnhanceProperties';
import { executeRemoveBackground } from './execute/executeRemoveBackground';
import { executeEnhance } from './execute/executeEnhance';
import { executeUltraUpscale } from './execute/executeUltraUpscale';
import { executeUltraEnhance } from './execute/executeUltraEnhance';
import { executeFaceEnhance } from './execute/executeFaceEnhance';
import { executeCarClassify } from './execute/executeCarClassify';
import { executeDescribeImage } from './execute/executeDescribeImage';
import { executeHashtag } from './execute/executeHashtag';
import { executeConvertPngToJpg } from './execute/executeConvertPngToJpg';
import { executeConvertPngToWebp } from './execute/executeConvertPngToWebp';
import { executeCropImage } from './execute/executeCropImage';
import { executeResizeImage } from './execute/executeResizeImage';
import { executeWatermark } from './execute/executeWatermark';

export class PicsartImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Image AI',
		name: 'picsartImage',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description: 'Image processing with Picsart API: convert formats, crop, resize, remove backgrounds, enhance, upscale, restore faces, watermark, and analyze images',
		subtitle: '={{ $parameter["operation"] : $parameter["resource"] }}',
		defaults: {
			name: 'Picsart Image AI',
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
					name: 'Car Classify',
					value: 'Car Classify',
					action: 'Classify car image',
					description: 'Classify a car image into categories (exterior, interior, engine, undercarriage, other)',
				},
				{
					name: 'Convert PNG to JPG',
					value: 'Convert PNG to JPG',
					action: 'Convert PNG image to JPG format',
					description: 'Convert PNG images to JPG format',
				},
				{
					name: 'Convert PNG to WEBP',
					value: 'Convert PNG to WEBP',
					action: 'Convert PNG image to WEBP format',
					description: 'Convert PNG images to WEBP format',
				},
				{
					name: 'Crop Image',
					value: 'Crop Image',
					action: 'Crop image to specific dimensions',
					description: 'Crop image to specified width and height',
				},
				{
					name: 'Describe Image',
					value: 'Describe Image',
					action: 'Generate text description from image',
					description: 'Generate a detailed text description for the provided image (image-to-text)',
				},
				{
					name: 'Enhance',
					value: 'Enhance',
					action: 'Enhance and upscale an image',
					description: 'Enhance and upscale an image',
				},
				{
					name: 'Face Enhance',
					value: 'Face Enhance',
					action: 'Enhance faces in photos',
					description: 'Turn old, blurry photos into clear portraits with AI face restoration',
				},
				{
					name: 'Hashtag',
					value: 'Hashtag',
					action: 'Generate hashtags from image',
					description: 'Analyze image and suggest relevant hashtags for the content',
				},
				{
					name: 'Remove Background',
					value: 'Remove Background',
					action: 'Remove background from an image',
					description: 'Remove background from an image',
				},
				{
					name: 'Resize Image',
					value: 'Resize Image',
					action: 'Resize image to specific dimensions',
					description: 'Resize image to specified width and height',
				},
				{
					name: 'Ultra Enhance',
					value: 'Ultra Enhance',
					action: 'Ultra enhance with generative model',
					description: 'Generative upscaling with high frequency detail (2x-16x, up to 64Mpx)',
				},
			{
				name: 'Ultra Upscale',
				value: 'Ultra Upscale',
				action: 'Ultra upscale an image up to 16x',
				description: 'Ultra upscale an image with advanced AI (2x-16x)',
			},
			{
				name: 'Watermark',
				value: 'Watermark',
				action: 'Add watermark to image',
				description: 'Add a watermark or logo to protect images from unauthorized usage',
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
					operation: ['Remove Background', 'Enhance', 'Car Classify', 'Describe Image', 'Watermark', 'Hashtag', 'Convert PNG to JPG', 'Convert PNG to WEBP', 'Crop Image', 'Resize Image'],
				},
			},
		},

		// Car Classify Operation Parameters
		...carClassifyProperties,
		// Describe Image Operation Parameters
		...describeImageProperties,
		// Hashtag Operation Parameters
		...hashtagProperties,
		// Convert PNG to JPG Operation Parameters
		...convertPngToJpgProperties,
		// Convert PNG to WEBP Operation Parameters
		...convertPngToWebpProperties,
		// Crop Image Operation Parameters
		...cropImageProperties,
		// Resize Image Operation Parameters
		...resizeImageProperties,
		// Watermark Operation Parameters
		...watermarkProperties,
		// Remove Background Operation Parameters
            ...removeBgProperties,
		// Enhance Operation Parameters
        ...enhanceProperties,
		// Ultra Upscale Operation Parameters
        ...ultraUpscaleProperties,
		// Ultra Enhance Operation Parameters
        ...ultraEnhanceProperties,
		// Face Enhance Operation Parameters
        ...faceEnhanceProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items: INodeExecutionData[] = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get operation
				const operation: string = this.getNodeParameter('operation', itemIndex) as string;
				if (operation === 'Car Classify') {
					await executeCarClassify(this, itemIndex, returnData);
				} else if (operation === 'Describe Image') {
					await executeDescribeImage(this, itemIndex, returnData);
				} else if (operation === 'Hashtag') {
					await executeHashtag(this, itemIndex, returnData);
				} else if (operation === 'Convert PNG to JPG') {
					await executeConvertPngToJpg(this, itemIndex, returnData);
				} else if (operation === 'Convert PNG to WEBP') {
					await executeConvertPngToWebp(this, itemIndex, returnData);
				} else if (operation === 'Crop Image') {
					await executeCropImage(this, itemIndex, returnData);
				} else if (operation === 'Resize Image') {
					await executeResizeImage(this, itemIndex, returnData);
				} else if (operation === 'Watermark') {
					await executeWatermark(this, itemIndex, returnData);
				} else if (operation === 'Remove Background') {
					await executeRemoveBackground(this, itemIndex, returnData);
				} else if (operation === 'Enhance') {
					await executeEnhance(this, itemIndex, returnData);
				} else if (operation === 'Ultra Upscale') {
					await executeUltraUpscale(this, itemIndex, returnData);
				} else if (operation === 'Ultra Enhance') {
					await executeUltraEnhance(this, itemIndex, returnData);
				} else if (operation === 'Face Enhance') {
					await executeFaceEnhance(this, itemIndex, returnData);
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
