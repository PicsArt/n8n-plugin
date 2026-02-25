import type { INodeProperties } from 'n8n-workflow';

export const ctvEncodeProperties: INodeProperties[] = [
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
				operation: ['Make Video CTV-Compatible'],
			},
		},
	},
];
