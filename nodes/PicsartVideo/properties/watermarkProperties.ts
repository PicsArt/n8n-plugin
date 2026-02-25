import type { INodeProperties } from 'n8n-workflow';
const formatOptions = [
	{ name: 'MP4', value: 'MP4' },
	{ name: 'MOV', value: 'MOV' },
	{ name: 'WEBM', value: 'WEBM' },
];
const anchorPointOptions = [
	{ name: 'left-top', value: 'left-top' },
	{ name: 'left-middle', value: 'left-middle' },
	{ name: 'left-bottom', value: 'left-bottom' },
	{ name: 'center-top', value: 'center-top' },
	{ name: 'center-middle', value: 'center-middle' },
	{ name: 'center-bottom', value: 'center-bottom' },
	{ name: 'right-top', value: 'right-top' },
	{ name: 'right-middle', value: 'right-middle' },
	{ name: 'right-bottom', value: 'right-bottom' },
	{ name: 'Pattern', value: 'pattern' },
];

export const watermarkProperties: INodeProperties[] = [
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
				operation: ['Add Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Source',
		name: 'watermarkSource',
		type: 'options',
		default: 'url',
		description: 'Provide watermark image via URL or binary file',
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
			},
		},
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Binary', value: 'binary' },
		],
	},
	{
		displayName: 'Watermark URL',
		name: 'watermarkUrl',
		type: 'string',
		default: '',
		description: 'Source watermark image URL (required when Watermark Source is URL)',
		placeholder: 'https://example.com/watermark.png',
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				watermarkSource: ['url'],
			},
		},
	},
	{
		displayName: 'Binary Property Name',
		name: 'watermarkBinaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'Name of the binary property containing the watermark image',
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				watermarkSource: ['binary'],
			},
		},
	},
	{
		displayName: 'Anchor Point',
		name: 'anchorPoint',
		type: 'options',
		default: 'center-middle',
		description: 'Position of the watermark on the video',
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
			},
		},
		options: anchorPointOptions,
	},
	{
		displayName: 'Watermark Width',
		name: 'watermarkWidth',
		type: 'number',
		default: null,
		description: 'Width of the watermark (pixels, ≥ 1)',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				mode: ['advanced'],   // only show when Mode = Advanced

			},
		},
	},
	{
		displayName: 'Watermark Height',
		name: 'watermarkHeight',
		type: 'number',
		default: null,
		description: 'Height of the watermark (pixels, ≥ 1)',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				mode: ['advanced'],   // only show when Mode = Advanced
			},
		},
	},
	{
		displayName: 'Watermark Opacity',
		name: 'watermarkOpacity',
		type: 'number',
		default: 50,
		description: 'Opacity of the watermark (0–100). Default 50.',
		typeOptions: {
			minValue: 0,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				mode: ['advanced'],   // only show when Mode = Advanced
			},
		},
	},
	{
		displayName: 'Watermark Angle',
		name: 'watermarkAngle',
		type: 'number',
		default: null,
		description: 'Rotation angle of the watermark (0–360 degrees)',
		typeOptions: {
			minValue: 0,
			maxValue: 360,
		},
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				mode: ['advanced'],   // only show when Mode = Advanced
			},
		},
	},
	{
		displayName: 'Horizontal Padding',
		name: 'watermarkPaddingX',
		type: 'number',
		default: 0,
		description: 'Horizontal padding of the watermark (≥ 0)',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				mode: ['advanced'],   // only show when Mode = Advanced
			},
		},
	},
	{
		displayName: 'Vertical Padding',
		name: 'watermarkPaddingY',
		type: 'number',
		default: 0,
		description: 'Vertical padding of the watermark (≥ 0)',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				mode: ['advanced'],   // only show when Mode = Advanced
			},
		},
	},
	{
		displayName: 'Export Format',
		name: 'exportFormat',
		type: 'options',
		default: 'MP4',
		description: 'Output video format',
		displayOptions: {
			show: {
				operation: ['Add Watermark'],
				mode: ['advanced'],
			},
		},
		options: formatOptions,
	},
];
