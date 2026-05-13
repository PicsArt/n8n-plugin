import type { INodeProperties } from 'n8n-workflow';

export const text2SoundProperties: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'text2SoundPrompt',
		type: 'string',
		required: true,
		default: '',
		description: 'Prompt describing the music or sound to generate',
		displayOptions: {
			show: {
				operation: ['Generate Music/Sound from Prompt'],
			},
		},
	},
	{
		displayName: 'Duration (Seconds)',
		name: 'text2SoundDuration',
		type: 'number',
		default: 0,
		description:
			'Audio length in seconds (0.5–22 when set). Use 0 to omit and let the provider pick automatically. Vendor ranges differ (e.g. ElevenLabs 0.5–22, Kling 3–10).',
		typeOptions: {
			minValue: 0,
			maxValue: 22,
		},
		displayOptions: {
			show: {
				operation: ['Generate Music/Sound from Prompt'],
			},
		},
	},
	{
		displayName: 'Loop',
		name: 'text2SoundLoop',
		type: 'boolean',
		default: false,
		description:
			'Whether to request looping audio. Only some models support this (e.g. ElevenLabs); others may ignore it.',
		displayOptions: {
			show: {
				operation: ['Generate Music/Sound from Prompt'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'text2SoundModel',
		type: 'options',
		default: 'urn:air:elevenlabs:model:elevenlabs:elevenlabs-sound-effects-v2@1',
		description:
			'AI model for text-to-sound. Set explicitly for consistent behavior. Capabilities and duration limits vary by provider.',
		displayOptions: {
			show: {
				operation: ['Generate Music/Sound from Prompt'],
			},
		},
		options: [
			{ name: 'urn:air:elevenlabs:model:elevenlabs:elevenlabs-sound-effects-v2@1', value: 'urn:air:elevenlabs:model:elevenlabs:elevenlabs-sound-effects-v2@1' },
			{ name: 'urn:air:kling:model:kling:kling-text-to-audio@1', value: 'urn:air:kling:model:kling:kling-text-to-audio@1' },
		],
	},
];
