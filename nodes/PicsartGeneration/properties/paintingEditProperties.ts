import type { INodeProperties } from 'n8n-workflow';

export const paintingEditProperties: INodeProperties[] = [
	{
		displayName: 'Image Source',
		name: 'paintingEditResource',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Binary Image', value: 'DATA' },
			{ name: 'Image URL', value: 'Image URL' },
		],
		default: 'Image URL',
		displayOptions: {
			show: {
				operation: ['Edit Image with Prompt'],
			},
		},
	},
	{
		displayName: 'Input Binary Field',
		name: 'paintingEditInputBinaryField',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the source image binary',
		displayOptions: {
			show: {
				paintingEditResource: ['DATA'],
				operation: ['Edit Image with Prompt'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'paintingEditImageUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/image.jpg',
		description: 'Source image URL (1–2083 characters)',
		displayOptions: {
			show: {
				paintingEditResource: ['Image URL'],
				operation: ['Edit Image with Prompt'],
			},
		},
	},
	{
		displayName: 'Prompt',
		name: 'paintingEditPrompt',
		type: 'string',
		required: true,
		default: '',
		description: 'Describe how to edit or transform the image',
		displayOptions: {
			show: {
				operation: ['Edit Image with Prompt'],
			},
		},
	},
	{
		displayName: 'Count',
		name: 'paintingEditCount',
		type: 'number',
		default: 2,
		description: 'Number of edited images to generate (1–10)',
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		displayOptions: {
			show: {
				operation: ['Edit Image with Prompt'],
			},
		},
	},
	{
		displayName: 'Format',
		name: 'paintingEditFormat',
		type: 'options',
		default: 'JPG',
		description: 'Output image format',
		options: [
			{ name: 'JPG', value: 'JPG' },
			{ name: 'PNG', value: 'PNG' },
			{ name: 'WEBP', value: 'WEBP' },
		],
		displayOptions: {
			show: {
				operation: ['Edit Image with Prompt'],
			},
		},
	},
	{
		displayName: 'Mode',
		name: 'paintingEditMode',
		type: 'options',
		default: 'sync',
		description:
			'Deprecated query parameter for sync vs async. Prefer the HTTP Prefer header when possible. If both are set, Prefer wins.',
		options: [
			{ name: 'Async', value: 'async' },
			{ name: 'Sync', value: 'sync' },
		],
		displayOptions: {
			show: {
				operation: ['Edit Image with Prompt'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'paintingEditModel',
		type: 'options',
		default: 'urn:air:sdxl:model:fluxai:flux_kontext_max-image-to-image@1',
		description:
			'AI model for image-to-image editing. Set explicitly for consistent behavior across API changes.',
		displayOptions: {
			show: {
				operation: ['Edit Image with Prompt'],
			},
		},
		options: [
			{ name: 'urn:air:fluxai:model:fluxai:flux-2-flex-image-to-image@1', value: 'urn:air:fluxai:model:fluxai:flux-2-flex-image-to-image@1' },
			{ name: 'urn:air:fluxai:model:fluxai:flux-2-max-image-to-image@1', value: 'urn:air:fluxai:model:fluxai:flux-2-max-image-to-image@1' },
			{ name: 'urn:air:fluxai:model:fluxai:flux-2-pro-image-to-image@1', value: 'urn:air:fluxai:model:fluxai:flux-2-pro-image-to-image@1' },
			{ name: 'urn:air:google:model:google:gemini-2.5-flash-image-image-to-image@1', value: 'urn:air:google:model:google:gemini-2.5-flash-image-image-to-image@1' },
			{ name: 'urn:air:google:model:google:gemini-3-pro-image-preview-image-to-image@1', value: 'urn:air:google:model:google:gemini-3-pro-image-preview-image-to-image@1' },
			{ name: 'urn:air:google:model:google:gemini-3.1-flash-image-preview-image-to-image@1', value: 'urn:air:google:model:google:gemini-3.1-flash-image-preview-image-to-image@1' },
			{ name: 'urn:air:google:model:google:gemini-3.1-pro-preview-image-to-image@1', value: 'urn:air:google:model:google:gemini-3.1-pro-preview-image-to-image@1' },
			{ name: 'urn:air:openai:model:openai:gpt-image-1-image-to-image@1', value: 'urn:air:openai:model:openai:gpt-image-1-image-to-image@1' },
			{ name: 'urn:air:qwen:model:qwen:qwen-image-edit-plus-image-to-image@1', value: 'urn:air:qwen:model:qwen:qwen-image-edit-plus-image-to-image@1' },
			{ name: 'urn:air:qwen:model:qwen:qwen-image-image-to-image@1', value: 'urn:air:qwen:model:qwen:qwen-image-image-to-image@1' },
			{ name: 'urn:air:reve:model:reve:reve-edit-image-to-image@1', value: 'urn:air:reve:model:reve:reve-edit-image-to-image@1' },
			{ name: 'urn:air:runway:model:runway:gen4-image-ref-image-to-image@1', value: 'urn:air:runway:model:runway:gen4-image-ref-image-to-image@1' },
			{ name: 'urn:air:sdxl:model:fluxai:flux_kontext_max-image-to-image@1', value: 'urn:air:sdxl:model:fluxai:flux_kontext_max-image-to-image@1' },
			{ name: 'urn:air:sdxl:model:fluxai:flux_kontext_pro-image-to-image@1', value: 'urn:air:sdxl:model:fluxai:flux_kontext_pro-image-to-image@1' },
			{ name: 'urn:air:seedream:model:seedream:seedream-4.0-image-to-image@1', value: 'urn:air:seedream:model:seedream:seedream-4.0-image-to-image@1' },
			{ name: 'urn:air:seedream:model:seedream:seedream-4.5-image-to-image@1', value: 'urn:air:seedream:model:seedream:seedream-4.5-image-to-image@1' },
			{ name: 'urn:air:seedream:model:seedream:seedream-5.0-lite-image-to-image@1', value: 'urn:air:seedream:model:seedream:seedream-5.0-lite-image-to-image@1' },
			{ name: 'urn:air:xai:model:xai:grok-imagine-image-edit-image-to-image@1', value: 'urn:air:xai:model:xai:grok-imagine-image-edit-image-to-image@1' },
		],
	},
];
