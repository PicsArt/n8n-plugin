import type { INodeProperties } from 'n8n-workflow';

export const videoFpsUpscaleProperties: INodeProperties[] = [
	{
		displayName: 'Video URL',
		name: 'video_url',
		type: 'string',
		required: true,
		default: '',
		description: 'URL of the source video to upscale FPS',
		placeholder: 'https://example.com/video.mp4',
		displayOptions: {
			show: {
				operation: ['Video FPS Upscale'],
			},
		},
	},
];
