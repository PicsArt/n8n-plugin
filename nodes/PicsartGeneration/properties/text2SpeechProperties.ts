import type { INodeProperties } from 'n8n-workflow';

export const text2SpeechProperties: INodeProperties[] = [
	{
		displayName: 'Text',
		name: 'text2SpeechText',
		type: 'string',
		required: true,
		default: '',
		description: 'The text to speak (up to 5000 characters)',
		displayOptions: {
			show: {
				operation: ['Generate Speech from Prompt'],
			},
		},
	},
	{
		displayName: 'Language',
		name: 'text2SpeechLanguage',
		type: 'options',
		default: 'en',
		description: 'The language to speak',
		options: [
			{ name: 'En', value: 'en' },
			{ name: 'Fr', value: 'fr' },
		],
		displayOptions: {
			show: {
				operation: ['Generate Speech from Prompt'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'text2SpeechModel',
		type: 'options',
		default: 'urn:air:openai:model:openai:tts-1@1',
		description:
			'AI model for text-to-speech. For consistent behavior, set this explicitly. Voice availability depends on the provider.',
		displayOptions: {
			show: {
				operation: ['Generate Speech from Prompt'],
			},
		},
		options: [
			{ name: 'urn:air:async:model:async:async-flash-v1.0@1', value: 'urn:air:async:model:async:async-flash-v1.0@1' },
			{ name: 'urn:air:elevenlabs:model:elevenlabs:eleven-v3@1', value: 'urn:air:elevenlabs:model:elevenlabs:eleven-v3@1' },
			{ name: 'urn:air:openai:model:openai:tts-1@1', value: 'urn:air:openai:model:openai:tts-1@1' },
		],
	},
	{
		displayName: 'Voice',
		name: 'text2SpeechVoice',
		type: 'string',
		default: '',
		description:
			'Optional voice name for synthesis. Supported voices vary by model; see your provider’s documentation. When empty, provider defaults apply (e.g. OpenAI alloy, ElevenLabs Rachel, Async nyomi).',
		displayOptions: {
			show: {
				operation: ['Generate Speech from Prompt'],
			},
		},
	},
];
