import type { INodeProperties } from 'n8n-workflow';

export const text2StickerProperties: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		default: '',
		description: 'Text prompt describing the sticker to generate',
		placeholder: 'e.g., A cute cartoon cat with big eyes',
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'width',
		type: 'number',
		default: 1024,
		description: 'Desired width used to determine the aspect ratio and resolution tier (64-1024 pixels)',
		typeOptions: {
			minValue: 64,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'height',
		type: 'number',
		default: 1024,
		description: 'Desired height used to determine the aspect ratio and resolution tier (64-1024 pixels)',
		typeOptions: {
			minValue: 64,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
	},
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		default: 2,
		description: 'Number of stickers to generate (1-10)',
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
	},
];
