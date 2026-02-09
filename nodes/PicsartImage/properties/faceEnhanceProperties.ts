import { INodeProperties } from 'n8n-workflow';

export const faceEnhanceProperties: INodeProperties[] = [
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
				operation: ['Face Enhance'],
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
				operation: ['Face Enhance'],
				resource: ['Image URL'],
			},
		},
		description: 'URL of the source image with faces to enhance (1-2083 characters)',
		placeholder: 'https://example.com/portrait.jpg',
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
				operation: ['Face Enhance'],
				resource: ['DATA'],
			},
		},
		description: 'The name of the input binary field containing the image',
		placeholder: 'data',
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
				operation: ['Face Enhance'],
			},
		},
		description: 'Output image format',
	},
];
