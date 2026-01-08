import type { INodeProperties } from 'n8n-workflow';

export const enhanceProperties: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'inputBinaryField',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the binary data',
		hint: 'The field typically comes from HTTP Request, Read Binary File, or previous processing nodes',
		displayOptions: {
			show: {
				resource: ['binaryImage'],
				operation: ['enhance'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'image_url',
		type: 'string',
		default: '',
		placeholder: '{{$json["image_url"]}}',
		description: 'URL image for processing',
		displayOptions: {
			show: {
				resource: ['imageUrl'],
				operation: ['enhance'],
			},
		},
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
		displayOptions: {
			show: {
				resource: ['binaryImage', 'imageUrl'],
				operation: ['enhance'],
			},
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
		displayOptions: {
			show: {
				resource: ['binaryImage', 'imageUrl'],
				operation: ['enhance'],
			},
		},
	},
];