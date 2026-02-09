import type { INodeProperties } from 'n8n-workflow';

export const videoWatermarkProperties: INodeProperties[] = [
	{
		displayName: 'Video URL',
		name: 'video_url',
		type: 'string',
		required: true,
		default: '',
		description: 'URL of the source video (WEBM, MP4, or MOV format, max 100MB, max resolution 1920x1080)',
		placeholder: 'https://example.com/video.mp4',
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Source',
		name: 'watermarkSource',
		type: 'options',
		default: 'url',
		description: 'Choose how to provide the watermark image',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Binary Field', value: 'binary' },
		],
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Binary Field',
		name: 'watermarkBinaryField',
		type: 'string',
		default: 'watermark',
		description: 'The name of the input field containing the watermark image binary data',
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
				watermarkSource: ['binary'],
			},
		},
	},
	{
		displayName: 'Watermark URL',
		name: 'watermark_url',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/logo.png',
		description: 'URL of the watermark image',
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
				watermarkSource: ['url'],
			},
		},
	},
	{
		displayName: 'Anchor Point',
		name: 'anchor_point',
		type: 'options',
		default: 'center-middle',
		description: 'Position where the watermark will be placed',
		options: [
			{ name: 'Bottom Center', value: 'bottom-center' },
			{ name: 'Bottom Left', value: 'bottom-left' },
			{ name: 'Bottom Right', value: 'bottom-right' },
			{ name: 'Center Left', value: 'center-left' },
			{ name: 'Center Middle', value: 'center-middle' },
			{ name: 'Center Right', value: 'center-right' },
			{ name: 'Tile', value: 'tile' },
			{ name: 'Top Center', value: 'top-center' },
			{ name: 'Top Left', value: 'top-left' },
			{ name: 'Top Right', value: 'top-right' },
		],
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Width',
		name: 'watermark_width',
		type: 'number',
		default: 0,
		description: 'Width of the watermark in pixels. Set to 0 to keep original width.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Height',
		name: 'watermark_height',
		type: 'number',
		default: 0,
		description: 'Height of the watermark in pixels. Set to 0 to keep original height.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Opacity',
		name: 'watermark_opacity',
		type: 'number',
		default: 50,
		description: 'Opacity of the watermark (0-100). 0 = transparent, 100 = opaque.',
		typeOptions: {
			minValue: 0,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Angle',
		name: 'watermark_angle',
		type: 'number',
		default: 0,
		description: 'Rotation angle of the watermark (0-360 degrees)',
		typeOptions: {
			minValue: 0,
			maxValue: 360,
		},
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Padding X',
		name: 'watermark_padding_x',
		type: 'number',
		default: 0,
		description: 'Horizontal padding of the watermark in pixels',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
	{
		displayName: 'Watermark Padding Y',
		name: 'watermark_padding_y',
		type: 'number',
		default: 0,
		description: 'Vertical padding of the watermark in pixels',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				operation: ['Video Watermark'],
			},
		},
	},
];
