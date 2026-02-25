import type { INodeProperties } from 'n8n-workflow';

const formatOptions = [
	{ name: 'MP4', value: 'MP4' },
	{ name: 'MOV', value: 'MOV' },
	{ name: 'WEBM', value: 'WEBM' },
];

export const cropProperties: INodeProperties[] = [
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
				operation: ['Crop Video'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'width',
		type: 'number',
		required: true,
		default: 640,
		description: 'Width of the output video in px (≥ 16)',
		typeOptions: { minValue: 16 },
		displayOptions: {
			show: {
				operation: ['Crop Video'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'height',
		type: 'number',
		required: true,
		default: 360,
		description: 'Height of the output video in px (≥ 16)',
		typeOptions: { minValue: 16 },
		displayOptions: {
			show: {
				operation: ['Crop Video'],
			},
		},
	},
	{
		displayName: 'Start X',
		name: 'startX',
		type: 'number',
		default: 0,
		description: 'Starting x position of the crop in px (from left edge, ≥ 0)',
		typeOptions: { minValue: 0 },
		displayOptions: {
			show: {
				operation: ['Crop Video'],
			},
		},
	},
	{
		displayName: 'Start Y',
		name: 'startY',
		type: 'number',
		default: 0,
		description: 'Starting y position of the crop in px (from bottom edge, ≥ 0)',
		typeOptions: { minValue: 0 },
		displayOptions: {
			show: {
				operation: ['Crop Video'],
			},
		},
	},
	{
		displayName: 'Export Format',
		name: 'cropExportFormat',
		type: 'options',
		default: 'MP4',
		description: 'Output video format',
		displayOptions: {
			show: {
				operation: ['Crop Video'],
				mode: ['advanced'],
			},
		},
		options: formatOptions,
	},
];
