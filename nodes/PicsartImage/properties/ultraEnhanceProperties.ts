import { INodeProperties } from 'n8n-workflow';

export const ultraEnhanceProperties: INodeProperties[] = [
	// Resource selection (Image URL or Binary Data)
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Image URL',
				value: 'Image URL',
			},
			{
				name: 'Binary Data',
				value: 'DATA',
			},
		],
		default: 'Image URL',
		displayOptions: {
			show: {
				operation: ['Ultra Enhance'],
			},
		},
		description: 'Choose whether to provide an image URL or binary image data',
	},

	// Image URL input
	{
		displayName: 'Image URL',
		name: 'image_url',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['Ultra Enhance'],
				resource: ['Image URL'],
			},
		},
		description: 'URL of the source image to enhance (1-2083 characters)',
		placeholder: 'https://example.com/image.jpg',
	},

	// Binary data input
	{
		displayName: 'Input Binary Field',
		name: 'inputBinaryField',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: {
			show: {
				operation: ['Ultra Enhance'],
				resource: ['DATA'],
			},
		},
		description: 'The name of the input binary field containing the image',
		placeholder: 'data',
	},

	// Upscale Factor
	{
		displayName: 'Upscale Factor',
		name: 'upscale_factor',
		type: 'options',
		options: [
			{ name: '2x', value: 2 },
			{ name: '4x', value: 4 },
			{ name: '6x', value: 6 },
			{ name: '8x', value: 8 },
			{ name: '10x', value: 10 },
			{ name: '12x', value: 12 },
			{ name: '14x', value: 14 },
			{ name: '16x', value: 16 },
		],
		default: 2,
		displayOptions: {
			show: {
				operation: ['Ultra Enhance'],
			},
		},
		description: 'Upscale factor increases the image resolution (2-16). Supports up to 64Mpx output.',
	},

	// Output Format
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		options: [
			{ name: 'JPG', value: 'JPG' },
			{ name: 'PNG', value: 'PNG' },
			{ name: 'WEBP', value: 'WEBP' },
		],
		default: 'JPG',
		displayOptions: {
			show: {
				operation: ['Ultra Enhance'],
			},
		},
		description: 'Output image format',
	},
];
