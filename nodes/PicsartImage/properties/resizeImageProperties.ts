import type { INodeProperties } from 'n8n-workflow';

export const resizeImageProperties: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'inputBinaryField',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the binary data of the image to resize',
		hint: 'The field typically comes from HTTP Request, Read Binary File, or previous processing nodes',
		displayOptions: {
			show: {
				resource: ['DATA'],
				operation: ['Resize Image'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'image_url',
		type: 'string',
		default: '',
		placeholder: '{{$json["image_url"]}}',
		description: 'URL of the image to resize',
		displayOptions: {
			show: {
				resource: ['Image URL'],
				operation: ['Resize Image'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'width',
		type: 'number',
		required: true,
		default: 512,
		description: 'Width of the resized image in pixels',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['Resize Image'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'height',
		type: 'number',
		required: true,
		default: 512,
		description: 'Height of the resized image in pixels',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['Resize Image'],
			},
		},
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		default: 'JPG',
		description: 'Output image format',
		options: [
			{ name: 'JPG', value: 'JPG' },
			{ name: 'PNG', value: 'PNG' },
			{ name: 'WEBP', value: 'WEBP' },
		],
		displayOptions: {
			show: {
				operation: ['Resize Image'],
			},
		},
	},
];
