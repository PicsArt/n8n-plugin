import type { INodeProperties } from 'n8n-workflow';

export const fpsUpscaleProperties: INodeProperties[] = [
	{
		displayName: 'Video URL',
		name: 'videoUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'Source video URL. Upscaled to 60 FPS using Generative AI.',
		placeholder: 'https://example.com/video.mp4',
		displayOptions: {
			show: {
				operation: ['Video FPS Upscale'],
			},
		},
	},
];
