import type { INodeProperties } from 'n8n-workflow';

export const extractColorsProperties: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'inputBinaryField',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the binary image to extract colors from',
		displayOptions: {
			show: {
				resource: ['DATA'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'image_url',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/image.jpg',
		description: 'URL of the image to extract colors from (1–2083 characters)',
		displayOptions: {
			show: {
				resource: ['Image URL'],
			},
		},
	},
];
