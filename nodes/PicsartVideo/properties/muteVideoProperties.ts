import type { INodeProperties } from 'n8n-workflow';

export const muteVideoProperties: INodeProperties[] = [
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
				operation: ['Mute Video'],
			},
		},
	},
	{
		displayName: 'Mute',
		name: 'mute',
		type: 'boolean',
		default: true,
		description: 'Whether to mute the video (set volume to 0). When off, the original video volume (100%) is kept.',
		displayOptions: {
			show: {
				operation: ['Mute Video'],
				mode: ['advanced'],
			},
		},
	},
];
