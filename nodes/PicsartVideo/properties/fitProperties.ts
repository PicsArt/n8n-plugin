import type { INodeProperties } from 'n8n-workflow';

export const fitProperties: INodeProperties[] = [
	{
		displayName: 'Video URL',
		name: 'videoUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'Source video URL (WEBM, MP4 or MOV, max 100MB, max 1920x1080)',
		placeholder: 'https://example.com/video.mp4',
		displayOptions: {
			show: {
				operation: ['Fit Video'],
			},
		},
	},
	{
		displayName: 'Ratio',
		name: 'fitRatio',
		type: 'number',
		default: undefined,
		description: 'Width / height ratio (0.1–10). e.g. 1.778 for 16:9. Leave empty to keep original.',
		typeOptions: {
			minValue: 0.1,
			maxValue: 10,
			numberPrecision: 3,
		},
		displayOptions: {
			show: {
				operation: ['Fit Video'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'fitWidth',
		type: 'number',
		default: undefined,
		description: 'Target width in px (≥ 1). Leave empty to use ratio or original.',
		typeOptions: { minValue: 1 },
		displayOptions: {
			show: {
				operation: ['Fit Video'],
				mode: ['advanced'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'fitHeight',
		type: 'number',
		default: undefined,
		description: 'Target height in px (≥ 1). Leave empty to use ratio or original.',
		typeOptions: { minValue: 1 },
		displayOptions: {
			show: {
				operation: ['Fit Video'],
				mode: ['advanced'],
			},
		},
	},
	{
		displayName: 'Background Color',
		name: 'fitBgColor',
		type: 'color',
		default: '',
		description: 'Hex (e.g. #82d5fa, #fff) or color name (e.g. blue). If set, do not use Background Image/Video URL.',
		placeholder: '#000000 or blue',
		displayOptions: {
			show: {
				operation: ['Fit Video'],
				mode: ['advanced'],
			},
		},
	},
	{
		displayName: 'Background Blur',
		name: 'fitBgBlur',
		type: 'number',
		default: 0,
		description: 'Background blur 0–100',
		typeOptions: { minValue: 0, maxValue: 100 },
		displayOptions: {
			show: {
				operation: ['Fit Video'],
				mode: ['advanced'],
			},
		},
	},
	{
		displayName: 'Background Image URL',
		name: 'fitBgImageUrl',
		type: 'string',
		default: '',
		description: 'Background image URL. If set, do not use Background Color or Background Video URL.',
		placeholder: 'https://example.com/bg.png',
		displayOptions: {
			show: {
				operation: ['Fit Video'],
				mode: ['advanced'],
			},
		},
	},
	{
		displayName: 'Background Video URL',
		name: 'fitBgVideoUrl',
		type: 'string',
		default: '',
		description: 'Background video URL. If set, do not use Background Color or Background Image URL.',
		placeholder: 'https://example.com/bg.mp4',
		displayOptions: {
			show: {
				operation: ['Fit Video'],
				mode: ['advanced'],
			},
		},
	},
];
