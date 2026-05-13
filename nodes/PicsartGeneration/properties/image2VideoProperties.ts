import type { INodeProperties } from 'n8n-workflow';

export const image2VideoProperties: INodeProperties[] = [
	{
		displayName: 'Image Source',
		name: 'image2VideoResource',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Binary Image', value: 'DATA' },
			{ name: 'Image URL', value: 'Image URL' },
		],
		default: 'Image URL',
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Input Binary Field',
		name: 'image2VideoInputBinaryField',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the source image binary',
		displayOptions: {
			show: {
				image2VideoResource: ['DATA'],
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'image2VideoImageUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/image.jpg',
		description: 'Source image URL (1–2083 characters)',
		displayOptions: {
			show: {
				image2VideoResource: ['Image URL'],
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Prompt',
		name: 'image2VideoPrompt',
		type: 'string',
		required: true,
		default: '',
		description: 'Text prompt describing how the video should be generated from the image',
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'image2VideoWidth',
		type: 'number',
		default: 1024,
		description:
			'Desired width in pixels used to determine aspect ratio and resolution tier. Actual output is matched to the closest supported ratio for the model (e.g. 1:1, 4:3, 16:9, 9:16).',
		typeOptions: {
			minValue: 64,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'image2VideoHeight',
		type: 'number',
		default: 1024,
		description:
			'Desired height in pixels used to determine aspect ratio and resolution tier. Actual output is matched to the closest supported ratio for the model.',
		typeOptions: {
			minValue: 64,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Quality',
		name: 'image2VideoQuality',
		type: 'options',
		default: '480p',
		description: 'Video output quality or resolution tier',
		options: [
			{ name: '480p', value: '480p' },
			{ name: '720p', value: '720p' },
			{ name: '1080p', value: '1080p' },
		],
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Audio',
		name: 'image2VideoAudio',
		type: 'boolean',
		default: false,
		description:
			'Whether to generate video with audio. Some models always include sound regardless of this setting.',
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Video Length (Seconds)',
		name: 'image2VideoLength',
		type: 'number',
		default: 3,
		description: 'Desired video length in seconds. Mapped to the closest supported duration for the selected model.',
		typeOptions: {
			minValue: 1,
			maxValue: 20,
		},
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt and Image'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'image2VideoModel',
		type: 'options',
		default: 'urn:air:google:model:google:veo-3.1-fast-text-to-video@1',
		description:
			'AI model for image-to-video. For consistent behavior or to evaluate different models, set this explicitly. Output resolution and audio behavior may vary by model.',
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt and Image'],
			},
		},
		options: [
			{ name: 'urn:air:google:model:google:veo-2.0-exp-image-to-video@1', value: 'urn:air:google:model:google:veo-2.0-exp-image-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-2.0-image-to-video@1', value: 'urn:air:google:model:google:veo-2.0-image-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-fast-image-to-video@1', value: 'urn:air:google:model:google:veo-3.1-fast-image-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-fast-preview-image-to-video@1', value: 'urn:air:google:model:google:veo-3.1-fast-preview-image-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-fast-text-to-video@1', value: 'urn:air:google:model:google:veo-3.1-fast-text-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-image-to-video@1', value: 'urn:air:google:model:google:veo-3.1-image-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-preview-image-to-video@1', value: 'urn:air:google:model:google:veo-3.1-preview-image-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-1-image-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-1-image-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-1-master-image-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-1-master-image-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-5-turbo-image-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-5-turbo-image-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-6-image-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-6-image-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-master-image-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-master-image-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v3-image-to-video@1', value: 'urn:air:kling:model:kling:kling-v3-image-to-video@1' },
			{ name: 'urn:air:luma:model:luma:photon-1-image-to-video@1', value: 'urn:air:luma:model:luma:photon-1-image-to-video@1' },
			{ name: 'urn:air:luma:model:luma:photon-flash-1-image-to-video@1', value: 'urn:air:luma:model:luma:photon-flash-1-image-to-video@1' },
			{ name: 'urn:air:luma:model:luma:ray-1-6-image-to-video@1', value: 'urn:air:luma:model:luma:ray-1-6-image-to-video@1' },
			{ name: 'urn:air:luma:model:luma:ray-2-image-to-video@1', value: 'urn:air:luma:model:luma:ray-2-image-to-video@1' },
			{ name: 'urn:air:luma:model:luma:ray-flash-2-image-to-video@1', value: 'urn:air:luma:model:luma:ray-flash-2-image-to-video@1' },
			{ name: 'urn:air:minimax:model:minimax:hailuo-02-pro-image-to-video@1', value: 'urn:air:minimax:model:minimax:hailuo-02-pro-image-to-video@1' },
			{ name: 'urn:air:openai:model:openai:sora-2-image-to-video@1', value: 'urn:air:openai:model:openai:sora-2-image-to-video@1' },
			{ name: 'urn:air:openai:model:openai:sora-2-pro-image-to-video@1', value: 'urn:air:openai:model:openai:sora-2-pro-image-to-video@1' },
			{ name: 'urn:air:ovi:model:ovi:ovi-image-to-video@1', value: 'urn:air:ovi:model:ovi:ovi-image-to-video@1' },
			{ name: 'urn:air:runway:model:runway:gen4.5-image-to-video@1', value: 'urn:air:runway:model:runway:gen4.5-image-to-video@1' },
			{ name: 'urn:air:seedance:model:seedance:seedance-1.0-pro-fast-image-to-video@1', value: 'urn:air:seedance:model:seedance:seedance-1.0-pro-fast-image-to-video@1' },
			{ name: 'urn:air:seedance:model:seedance:seedance-1.0-pro-image-to-video@1', value: 'urn:air:seedance:model:seedance:seedance-1.0-pro-image-to-video@1' },
			{ name: 'urn:air:seedance:model:seedance:seedance-1.5-pro-image-to-video@1', value: 'urn:air:seedance:model:seedance:seedance-1.5-pro-image-to-video@1' },
			{ name: 'urn:air:wan:model:wan:wan-2.5-image-to-video@1', value: 'urn:air:wan:model:wan:wan-2.5-image-to-video@1' },
			{ name: 'urn:air:wan:model:wan:wan-2.6-image-to-video@1', value: 'urn:air:wan:model:wan:wan-2.6-image-to-video@1' },
			{ name: 'urn:air:xai:model:xai:grok-imagine-video-image-to-video@1', value: 'urn:air:xai:model:xai:grok-imagine-video-image-to-video@1' },
		],
	},
];
