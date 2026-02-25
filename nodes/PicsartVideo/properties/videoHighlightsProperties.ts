import type { INodeProperties } from 'n8n-workflow';

const formatOptions = [
	{ name: 'MP4', value: 'MP4' },
	{ name: 'MOV', value: 'MOV' },
	{ name: 'WEBM', value: 'WEBM' },
	{ name: 'GIF', value: 'GIF' },
];

export const videoHighlightsProperties: INodeProperties[] = [
	{
		displayName: 'Video URL',
		name: 'videoUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'Source video URL (length 1–2083)',
		placeholder: 'https://example.com/video.mp4',
		displayOptions: {
			show: {
				operation: ['Video Highlights'],
			},
		},
	},
	{
		displayName: 'Trim Segments',
		name: 'trimSegments',
		type: 'fixedCollection',
		typeOptions: {
			multipleValueButtonText: 'Add Segment',
		},
		default: {},
		description: 'Add 2–10 segments (start and end time in ms). These clips will be concatenated into one video.',
		displayOptions: {
			show: {
				operation: ['Video Highlights'],
			},
		},
		options: [
			{
				displayName: 'Segment',
				name: 'segment',
				values: [
					{
						displayName: 'Start (Ms)',
						name: 'start',
						type: 'number',
						default: 0,
						description: 'Start time of the segment in milliseconds (≥ 0)',
						typeOptions: { minValue: 0 },
					},
					{
						displayName: 'End (Ms)',
						name: 'end',
						type: 'number',
						default: 1000,
						description: 'End time of the segment in milliseconds (≥ 1, must be greater than start)',
						typeOptions: { minValue: 1 },
					},
				],
			},
		],
	},
	{
		displayName: 'Export Format',
		name: 'exportFormat',
		type: 'options',
		default: 'MP4',
		description: 'Output video format',
		displayOptions: {
			show: {
				operation: ['Video Highlights'],
				mode: ['advanced'],
			},
		},
		options: formatOptions,
	},
	{
		displayName: 'Frame Rate',
		name: 'exportFrameRate',
		type: 'number',
		default: 30,
		description: 'Output video frame rate (1–60)',
		typeOptions: { minValue: 1, maxValue: 60 },
		displayOptions: {
			show: {
				operation: ['Video Highlights'],
				mode: ['advanced'],
			},
		},
	},
	{
		displayName: 'Bitrate (Kb/s)',
		name: 'exportBitrate',
		type: 'number',
		default: undefined,
		description: 'Output bitrate in kb/s (1–10000). Leave empty for automatic.',
		typeOptions: { minValue: 1, maxValue: 10000 },
		displayOptions: {
			show: {
				operation: ['Video Highlights'],
				mode: ['advanced'],
			},
		},
	},
];
