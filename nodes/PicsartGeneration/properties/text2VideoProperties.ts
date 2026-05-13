import type { INodeProperties } from 'n8n-workflow';

export const text2VideoProperties: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'text2VideoPrompt',
		type: 'string',
		required: true,
		default: '',
		description: 'Text prompt describing the video to generate',
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'text2VideoWidth',
		type: 'number',
		default: 1024,
		description:
			'Desired width in pixels used to determine aspect ratio and resolution tier. Actual output is matched to the closest supported ratio for the model.',
		typeOptions: {
			minValue: 64,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'text2VideoHeight',
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
				operation: ['Generate Video from Prompt'],
			},
		},
	},
	{
		displayName: 'Quality',
		name: 'text2VideoQuality',
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
				operation: ['Generate Video from Prompt'],
			},
		},
	},
	{
		displayName: 'Audio',
		name: 'text2VideoAudio',
		type: 'boolean',
		default: false,
		description:
			'Whether to generate video with audio. Some models always include sound regardless of this setting.',
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt'],
			},
		},
	},
	{
		displayName: 'Video Length (Seconds)',
		name: 'text2VideoLength',
		type: 'number',
		default: 3,
		description: 'Desired video length in seconds. Mapped to the closest supported duration for the selected model.',
		typeOptions: {
			minValue: 1,
			maxValue: 20,
		},
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'text2VideoModel',
		type: 'options',
		default: 'urn:air:google:model:google:veo-3.1-fast-text-to-video@1',
		description:
			'AI model for text-to-video. For consistent behavior or to evaluate different models, set this explicitly. Output resolution and audio behavior may vary by model.',
		displayOptions: {
			show: {
				operation: ['Generate Video from Prompt'],
			},
		},
		options: [
			{ name: 'urn:air:google:model:google:veo-2.0-exp-text-to-video@1', value: 'urn:air:google:model:google:veo-2.0-exp-text-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-2.0-text-to-video@1', value: 'urn:air:google:model:google:veo-2.0-text-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-fast-preview-text-to-video@1', value: 'urn:air:google:model:google:veo-3.1-fast-preview-text-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-fast-text-to-video@1', value: 'urn:air:google:model:google:veo-3.1-fast-text-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-preview-text-to-video@1', value: 'urn:air:google:model:google:veo-3.1-preview-text-to-video@1' },
			{ name: 'urn:air:google:model:google:veo-3.1-text-to-video@1', value: 'urn:air:google:model:google:veo-3.1-text-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-1-master-text-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-1-master-text-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-5-turbo-text-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-5-turbo-text-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-6-text-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-6-text-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v2-master-text-to-video@1', value: 'urn:air:kling:model:kling:kling-v2-master-text-to-video@1' },
			{ name: 'urn:air:kling:model:kling:kling-v3-text-to-video@1', value: 'urn:air:kling:model:kling:kling-v3-text-to-video@1' },
			{ name: 'urn:air:ltxv:model:ltxv:ltxv-2-text-to-video-fast@1', value: 'urn:air:ltxv:model:ltxv:ltxv-2-text-to-video-fast@1' },
			{ name: 'urn:air:ltxv:model:ltxv:ltxv-2-text-to-video@1', value: 'urn:air:ltxv:model:ltxv:ltxv-2-text-to-video@1' },
			{ name: 'urn:air:minimax:model:minimax:hailuo-02-pro-text-to-video@1', value: 'urn:air:minimax:model:minimax:hailuo-02-pro-text-to-video@1' },
			{ name: 'urn:air:openai:model:openai:sora-2-pro@1', value: 'urn:air:openai:model:openai:sora-2-pro@1' },
			{ name: 'urn:air:openai:model:openai:sora-2@1', value: 'urn:air:openai:model:openai:sora-2@1' },
			{ name: 'urn:air:ovi:model:ovi:ovi-text-to-video@1', value: 'urn:air:ovi:model:ovi:ovi-text-to-video@1' },
			{ name: 'urn:air:pika:model:pika:pika-text-to-video-v2.2@1', value: 'urn:air:pika:model:pika:pika-text-to-video-v2.2@1' },
			{ name: 'urn:air:runway:model:runway:gen4.5-text-to-video@1', value: 'urn:air:runway:model:runway:gen4.5-text-to-video@1' },
			{ name: 'urn:air:seedance:model:seedance:seedance-1.0-pro-fast-text-to-video@1', value: 'urn:air:seedance:model:seedance:seedance-1.0-pro-fast-text-to-video@1' },
			{ name: 'urn:air:seedance:model:seedance:seedance-1.0-pro-text-to-video@1', value: 'urn:air:seedance:model:seedance:seedance-1.0-pro-text-to-video@1' },
			{ name: 'urn:air:seedance:model:seedance:seedance-1.5-pro-text-to-video@1', value: 'urn:air:seedance:model:seedance:seedance-1.5-pro-text-to-video@1' },
			{ name: 'urn:air:xai:model:xai:grok-imagine-video-text-to-video@1', value: 'urn:air:xai:model:xai:grok-imagine-video-text-to-video@1' },
		],
	},
];
