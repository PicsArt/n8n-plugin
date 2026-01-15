import type { INodeProperties } from 'n8n-workflow';

export const text2ImageProperties: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		default: '',
		description: 'Text prompt describing the image to generate',
		placeholder: 'e.g., A beautiful sunset over mountains',
		displayOptions: {
			show: {
				operation: ['text2Image'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'width',
		type: 'number',
		default: 1024,
		description: 'Width of the generated image in pixels (max 1024)',
		typeOptions: {
			minValue: 1,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['text2Image'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'height',
		type: 'number',
		default: 1024,
		description: 'Height of the generated image in pixels (max 1024)',
		typeOptions: {
			minValue: 1,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['text2Image'],
			},
		},
	},
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		default: 1,
		description: 'Number of images to generate',
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		displayOptions: {
			show: {
				operation: ['text2Image'],
			},
		},
	},
];

