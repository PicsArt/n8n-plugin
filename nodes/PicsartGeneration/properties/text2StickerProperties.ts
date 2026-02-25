import type { INodeProperties } from 'n8n-workflow';

export const text2StickerProperties: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		default: '',
		description: 'Text prompt describing the sticker to generate',
		placeholder: 'e.g., A cute cartoon cat with big eyes',
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'width',
		type: 'number',
		default: 1024,
		description: 'Desired width used to determine the aspect ratio and resolution tier (64-1024 pixels)',
		typeOptions: {
			minValue: 64,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'height',
		type: 'number',
		default: 1024,
		description: 'Desired height used to determine the aspect ratio and resolution tier (64-1024 pixels)',
		typeOptions: {
			minValue: 64,
			maxValue: 1024,
		},
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
	},
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		default: 2,
		description: 'Number of stickers to generate (1-10)',
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'urn:air:sdxl:model:fluxai:flux_kontext_max@1',
		description:
			'Optionally choose a specific AI model to use. If not specified, a default model will be applied. For consistent behavior or to evaluate different models, set this parameter explicitly.',
		displayOptions: {
			show: {
				operation: ['text2Sticker'],
			},
		},
		options: [
			{ name: 'urn:air:fluxai:model:fluxai:flux-2-flex@1', value: 'urn:air:fluxai:model:fluxai:flux-2-flex@1' },
			{ name: 'urn:air:fluxai:model:fluxai:flux-2-max@1', value: 'urn:air:fluxai:model:fluxai:flux-2-max@1' },
			{ name: 'urn:air:fluxai:model:fluxai:flux-2-pro@1', value: 'urn:air:fluxai:model:fluxai:flux-2-pro@1' },
			{ name: 'urn:air:google:model:google:gemini-2.0-flash-preview-image-generation@1', value: 'urn:air:google:model:google:gemini-2.0-flash-preview-image-generation@1' },
			{ name: 'urn:air:google:model:google:gemini-2.5-flash-image-preview@1', value: 'urn:air:google:model:google:gemini-2.5-flash-image-preview@1' },
			{ name: 'urn:air:google:model:google:gemini-2.5-flash-image@1', value: 'urn:air:google:model:google:gemini-2.5-flash-image@1' },
			{ name: 'urn:air:google:model:google:gemini-3-pro-image-preview@1', value: 'urn:air:google:model:google:gemini-3-pro-image-preview@1' },
			{ name: 'urn:air:google:model:google:imagen-4.0-fast-generate-001@1', value: 'urn:air:google:model:google:imagen-4.0-fast-generate-001@1' },
			{ name: 'urn:air:google:model:google:imagen-4.0-generate-001@1', value: 'urn:air:google:model:google:imagen-4.0-generate-001@1' },
			{ name: 'urn:air:google:model:google:imagen-4.0-ultra-generate-001@1', value: 'urn:air:google:model:google:imagen-4.0-ultra-generate-001@1' },
			{ name: 'urn:air:hunyuan:model:hunyuan:hunyuan-image@3', value: 'urn:air:hunyuan:model:hunyuan:hunyuan-image@3' },
			{ name: 'urn:air:ideogram:model:ideogram:ideogram-2a-turbo@1', value: 'urn:air:ideogram:model:ideogram:ideogram-2a-turbo@1' },
			{ name: 'urn:air:ideogram:model:ideogram:ideogram-2a@1', value: 'urn:air:ideogram:model:ideogram:ideogram-2a@1' },
			{ name: 'urn:air:ideogram:model:ideogram:ideogram-turbo@1', value: 'urn:air:ideogram:model:ideogram:ideogram-turbo@1' },
			{ name: 'urn:air:ideogram:model:ideogram:ideogram-turbo@2', value: 'urn:air:ideogram:model:ideogram:ideogram-turbo@2' },
			{ name: 'urn:air:ideogram:model:ideogram:ideogram@1', value: 'urn:air:ideogram:model:ideogram:ideogram@1' },
			{ name: 'urn:air:ideogram:model:ideogram:ideogram@2', value: 'urn:air:ideogram:model:ideogram:ideogram@2' },
			{ name: 'urn:air:ideogram:model:ideogram:ideogram@3', value: 'urn:air:ideogram:model:ideogram:ideogram@3' },
			{ name: 'urn:air:openai:model:openai:dall-e-3@1', value: 'urn:air:openai:model:openai:dall-e-3@1' },
			{ name: 'urn:air:openai:model:openai:gpt-image-1.5@1', value: 'urn:air:openai:model:openai:gpt-image-1.5@1' },
			{ name: 'urn:air:openai:model:openai:gpt-image-1@1', value: 'urn:air:openai:model:openai:gpt-image-1@1' },
			{ name: 'urn:air:qwen:model:qwen:qwen-image-2.5@1', value: 'urn:air:qwen:model:qwen:qwen-image-2.5@1' },
			{ name: 'urn:air:reve:model:reve:reve@1', value: 'urn:air:reve:model:reve:reve@1' },
			{ name: 'urn:air:runway:model:runway:gen4-image-ref@1', value: 'urn:air:runway:model:runway:gen4-image-ref@1' },
			{ name: 'urn:air:sdxl:model:fluxai:flux_kontext_max@1', value: 'urn:air:sdxl:model:fluxai:flux_kontext_max@1' },
			{ name: 'urn:air:sdxl:model:fluxai:flux_kontext_pro@1', value: 'urn:air:sdxl:model:fluxai:flux_kontext_pro@1' },
			{ name: 'urn:air:seedream:model:seedream:seedream@4.0', value: 'urn:air:seedream:model:seedream:seedream@4.0' },
			{ name: 'urn:air:seedream:model:seedream:seedream@4.5', value: 'urn:air:seedream:model:seedream:seedream@4.5' },
		],
	},
];
