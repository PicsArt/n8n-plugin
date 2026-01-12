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
	},
];
