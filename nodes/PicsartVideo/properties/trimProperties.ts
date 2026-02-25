import type { INodeProperties } from 'n8n-workflow';

const formatOptions = [
	{ name: 'MP4', value: 'MP4' },
	{ name: 'MOV', value: 'MOV' },
	{ name: 'WEBM', value: 'WEBM' },
];

export const trimProperties: INodeProperties[] = [
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
				operation: ['Clip a Video'],
			},
		},
	},
	{
		displayName: 'Start of the Clip in Milliseconds',
		name: 'start',
		type: 'number',
		default: 0,
		description: 'Start time of the trim in milliseconds (≥ 0)',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				operation: ['Clip a Video'],
			},
		},
	},
	{
		displayName: 'End of the Clip in Milliseconds',
		name: 'end',
		type: 'number',
		default: 1,
		description: 'End time of the trim in milliseconds (≥ 1, must be greater than Start)',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['Clip a Video'],
			},
		},
	},
	{
		displayName: 'End of the Clip in Milliseconds',
		name: 'end',
		type: 'number',
		default: 1,
		description: 'End time of the trim in milliseconds (≥ 1, must be greater than Start)',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['Clip a Video'],
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
				operation: ['Clip a Video'],
				mode: ['advanced'],
			},
		},
		options: formatOptions,
	},
];
