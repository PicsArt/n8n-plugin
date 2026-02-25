import type { INodeProperties } from 'n8n-workflow';

const effectOptions = [
	{ name: 'APR 1', value: 'apr1' },
	{ name: 'APR 2', value: 'apr2' },
	{ name: 'APR 3', value: 'apr3' },
	{ name: 'Bronze 1', value: 'brnz1' },
	{ name: 'Bronze 2', value: 'brnz2' },
	{ name: 'Bronze 3', value: 'brnz3' },
	{ name: 'Bronze 4', value: 'brnz4' },
	{ name: 'Cyber 1', value: 'cyber1' },
	{ name: 'Cyber 2', value: 'cyber2' },
	{ name: 'Cyber 3', value: 'cyber3' },
	{ name: 'Icy 1', value: 'icy1' },
	{ name: 'Icy 2', value: 'icy2' },
	{ name: 'Icy 3', value: 'icy3' },
	{ name: 'Icy 4', value: 'icy4' },
	{ name: 'Monochrome 1', value: 'mnch1' },
	{ name: 'Monochrome 2', value: 'mnch2' },
	{ name: 'Monochrome 3', value: 'mnch3' },
	{ name: 'Noise', value: 'noise' },
	{ name: 'Natural 1', value: 'ntrl1' },
	{ name: 'Natural 2', value: 'ntrl2' },
	{ name: 'Natural 3', value: 'ntrl3' },
	{ name: 'Pixelize', value: 'pixelize' },
	{ name: 'Saturation', value: 'saturation' },
	{ name: 'Soft 1', value: 'sft1' },
	{ name: 'Soft 2', value: 'sft2' },
	{ name: 'Soft 3', value: 'sft3' },
	{ name: 'Soft 4', value: 'sft4' },
	{ name: 'TL 1', value: 'tl1' },
	{ name: 'TL 2', value: 'tl2' },
	{ name: 'Sharpen', value: 'sharpen' },
	{ name: 'Vignette', value: 'vignette' },
];

const formatOptions = [
	{ name: 'MP4', value: 'MP4' },
	{ name: 'MOV', value: 'MOV' },
	{ name: 'WEBM', value: 'WEBM' },
];

export const videoEffectsProperties: INodeProperties[] = [
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
				operation: ['Video Filters and Effects'],
			},
		},
	},
	{
		displayName: 'Effect/Filter',
		name: 'effectName',
		type: 'options',
		required: true,
		default: 'vignette',
		description: 'Effect or filter to apply to the video',
		displayOptions: {
			show: {
				operation: ['Video Filters and Effects'],
			},
		},
		options: effectOptions,
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		required: true,
		default: 'MP4',
		description: 'Output video format (container)',
		displayOptions: {
			show: {
				operation: ['Video Filters and Effects'],
			},
		},
		options: formatOptions,
	},
];
