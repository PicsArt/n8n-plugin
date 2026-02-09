import type { INodeProperties } from 'n8n-workflow';

export const hashtagProperties: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'inputBinaryField',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the binary data of the image to analyze',
		hint: 'The field typically comes from HTTP Request, Read Binary File, or previous processing nodes',
		displayOptions: {
			show: {
				resource: ['DATA'],
				operation: ['Hashtag'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'image_url',
		type: 'string',
		default: '',
		placeholder: '{{$json["image_url"]}}',
		description: 'URL of the image to analyze for hashtag suggestions',
		displayOptions: {
			show: {
				resource: ['Image URL'],
				operation: ['Hashtag'],
			},
		},
	},
];
