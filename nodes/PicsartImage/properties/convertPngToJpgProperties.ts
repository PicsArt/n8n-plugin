import type { INodeProperties } from 'n8n-workflow';

export const convertPngToJpgProperties: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'inputBinaryField',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the PNG image binary data',
		hint: 'The field typically comes from HTTP Request, Read Binary File, or previous processing nodes',
		displayOptions: {
			show: {
				resource: ['DATA'],
				operation: ['Convert PNG to JPG'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'image_url',
		type: 'string',
		default: '',
		placeholder: '{{$json["image_url"]}}',
		description: 'URL of the PNG image to convert to JPG',
		displayOptions: {
			show: {
				resource: ['Image URL'],
				operation: ['Convert PNG to JPG'],
			},
		},
	},
];
