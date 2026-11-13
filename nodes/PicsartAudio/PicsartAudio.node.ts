/* eslint-disable n8n-nodes-base/node-param-description-excess-final-period -- Preserve owner-required identical full-sentence descriptions across Make, Zapier, and n8n. This is a punctuation-only exception. */
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { ApplicationError, NodeOperationError } from 'n8n-workflow';
import registry from './registry.json';

type Field = {
	type: string;
	label?: string;
	required?: boolean;
	default?: string | number | boolean;
	enum?: (string | number)[];
	min?: number;
	max?: number;
};
const schemas = registry.schemas as Record<string, Record<string, Field>>;
const groups = registry.groups as Record<string, { label: string; models: string[] }>;
const baseUrl = 'https://api.picsart.com/workflows/v1/models';
function field(key: string, spec: Field): INodeProperties {
	const value: INodeProperties = {
		displayName: spec.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
		name: key,
		type: spec.type === 'number' ? 'number' : spec.type === 'boolean' ? 'boolean' : 'string',
		default:
			spec.default ??
			(spec.type === 'number' ? (spec.min ?? 0) : spec.type === 'boolean' ? false : ''),
	};
	if (spec.enum) {
		value.type = 'options';
		value.options = spec.enum.map((v) => ({ name: String(v), value: v }));
		value.default = spec.default ?? spec.enum[0];
	}
	if (spec.type === 'number') value.typeOptions = { minValue: spec.min, maxValue: spec.max };
	if (spec.type === 'file')
		value.description = spec.max
			? `Accessible HTTPS media URLs, 1 per line, up to ${spec.max}`
			: 'An accessible HTTPS media URL';
	return value;
}
const properties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'generate_music',
		options: [
			{
				name: 'Change a voice',
				value: 'change_voice',
				description:
					'Submit a voice change task with Picsart. Use the returned task ID to check progress and retrieve the audio.',
				action: 'Change a voice',
			},
			{
				name: 'Convert text to speech',
				value: 'text_to_speech',
				description:
					'Convert text to speech with Picsart. Use the returned task ID to check progress and retrieve the audio.',
				action: 'Convert text to speech',
			},
			{
				name: 'Design a voice',
				value: 'design_voice',
				description:
					'Create a voice from a description with Picsart. Use the returned task ID to check progress and retrieve the result.',
				action: 'Design a voice',
			},
			{
				name: 'Dub audio',
				value: 'dub_audio',
				description:
					'Submit an audio dubbing task with Picsart. Use the returned task ID to check progress and retrieve the result.',
				action: 'Dub audio',
			},
			{
				name: 'Generate audio from video',
				value: 'generate_audio_from_video',
				description:
					'Generate audio for a video with Picsart. Use the returned task ID to check progress and retrieve the result.',
				action: 'Generate audio from video',
			},
			{
				name: 'Generate music',
				value: 'generate_music',
				description:
					'Generate music from a prompt with Picsart. Use the returned task ID to check progress and retrieve the audio.',
				action: 'Generate music',
			},
			{
				name: 'Generate sound effects',
				value: 'generate_sound_effects',
				description:
					'Generate sound effects from a text description with Picsart. Use the returned task ID to retrieve the audio.',
				action: 'Generate sound effects',
			},
			{
				name: 'Generate voiceover',
				value: 'generate_voiceover',
				description:
					'Generate a voiceover from a script with Picsart. Use the returned task ID to check progress and retrieve the audio.',
				action: 'Generate voiceover',
			},
			{
				name: 'Get audio result',
				value: 'get_audio_result',
				description:
					'Check an audio task and retrieve its available outputs when processing is complete.',
				action: 'Get an audio result',
			},
			{
				name: 'Isolate audio',
				value: 'isolate_audio',
				description:
					'Submit an audio isolation task with Picsart. Use the returned task ID to check progress and retrieve the result.',
				action: 'Isolate audio',
			},
		],
	},
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		required: true,
		default: '',
		description:
			'Map the saved generation task ID. Checking a result does not submit a new generation.',
		displayOptions: { show: { operation: ['get_audio_result'] } },
	},
];
properties.push(
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'lyria-3-pro',
		options: [
			{
				name: 'ElevenLabs Music v2',
				value: 'elevenlabs-music-v2',
				description:
					'Generate vocal or instrumental music from a text prompt for soundtracks and audio projects.',
			},
			{
				name: 'Lyria 3 Clip',
				value: 'lyria-3-clip',
				description: 'Generate a music clip from text and image prompts for soundtrack concepts.',
			},
			{
				name: 'Lyria 3 Pro',
				value: 'lyria-3-pro',
				description: 'Generate music with vocals for longer soundtracks and song concepts.',
			},
			{
				name: 'Lyria 3.5',
				value: 'lyria-3.5',
				description: 'Generate songs with vocals from text and image prompts for music projects.',
			},
			{
				name: 'MiniMax Music v2',
				value: 'minimax-music-v2',
				description: 'Generate vocal or instrumental music from style and lyric prompts.',
			},
			{
				name: 'MiniMax Music v3',
				value: 'minimax-music-v3',
				description:
					'Generate music from a style prompt and optional lyrics with configurable audio encoding.',
			},
		],
		displayOptions: {
			show: {
				operation: ['generate_music'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'eleven-v3',
		options: [
			{
				name: 'Async Flash v1.0',
				value: 'async-flash-v1',
				description:
					'Convert text to speech with the Async Flash voice engine for narration and voiceovers.',
			},
			{
				name: 'Eleven v3',
				value: 'eleven-v3',
				description:
					'Convert a script to speech with tone and pacing controls for narration and voiceovers.',
			},
			{
				name: 'Eleven v4',
				value: 'eleven-v4',
				description: 'Convert a script to speech with audio tags to direct voiceover delivery.',
			},
			{
				name: 'Eleven v4 Turbo',
				value: 'eleven-v4-turbo',
				description:
					'Convert a script to speech with the Turbo voice engine and audio tags for voiceover delivery.',
			},
			{
				name: 'Gemini 2.5 Flash TTS',
				value: 'gemini-2.5-flash-tts',
				description:
					'Convert text to speech with multilingual voices for narration and voiceovers.',
			},
			{
				name: 'Gemini 2.5 Pro TTS',
				value: 'gemini-2.5-pro-tts',
				description: 'Convert text to speech for narration and dialogue with speaker settings.',
			},
			{
				name: 'Gemini 3.8 Flash Lite TTS',
				value: 'gemini-3.8-flash-lite-tts',
				description:
					'Convert text to speech with delivery instructions using the Flash Lite voice model.',
			},
			{
				name: 'Gemini 3.8 Flash TTS',
				value: 'gemini-3.8-flash-tts',
				description:
					'Convert text to speech with delivery instructions and vocal events for expressive narration.',
			},
			{
				name: 'Grok TTS',
				value: 'grok-tts',
				description: 'Convert text to multilingual speech for narration and voiceovers.',
			},
			{
				name: 'Seed Audio',
				value: 'seed-audio-1.0',
				description:
					'Convert English or Chinese text to speech using a named voice or a permitted audio reference.',
			},
			{
				name: 'Seed Audio Multilingual',
				value: 'seed-audio-1.0-multilingual',
				description:
					'Convert multilingual text to speech using a named voice or a permitted audio reference.',
			},
		],
		displayOptions: {
			show: {
				operation: ['generate_voiceover'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'eleven-v3',
		options: [
			{
				name: 'Async Flash v1.0',
				value: 'async-flash-v1',
				description:
					'Convert text to speech with the Async Flash voice engine for narration and voiceovers.',
			},
			{
				name: 'Eleven v3',
				value: 'eleven-v3',
				description:
					'Convert a script to speech with tone and pacing controls for narration and voiceovers.',
			},
			{
				name: 'Eleven v4',
				value: 'eleven-v4',
				description: 'Convert a script to speech with audio tags to direct voiceover delivery.',
			},
			{
				name: 'Eleven v4 Turbo',
				value: 'eleven-v4-turbo',
				description:
					'Convert a script to speech with the Turbo voice engine and audio tags for voiceover delivery.',
			},
			{
				name: 'Gemini 2.5 Flash TTS',
				value: 'gemini-2.5-flash-tts',
				description:
					'Convert text to speech with multilingual voices for narration and voiceovers.',
			},
			{
				name: 'Gemini 2.5 Pro TTS',
				value: 'gemini-2.5-pro-tts',
				description: 'Convert text to speech for narration and dialogue with speaker settings.',
			},
			{
				name: 'Gemini 3.8 Flash Lite TTS',
				value: 'gemini-3.8-flash-lite-tts',
				description:
					'Convert text to speech with delivery instructions using the Flash Lite voice model.',
			},
			{
				name: 'Gemini 3.8 Flash TTS',
				value: 'gemini-3.8-flash-tts',
				description:
					'Convert text to speech with delivery instructions and vocal events for expressive narration.',
			},
			{
				name: 'Grok TTS',
				value: 'grok-tts',
				description: 'Convert text to multilingual speech for narration and voiceovers.',
			},
			{
				name: 'Seed Audio',
				value: 'seed-audio-1.0',
				description:
					'Convert English or Chinese text to speech using a named voice or a permitted audio reference.',
			},
			{
				name: 'Seed Audio Multilingual',
				value: 'seed-audio-1.0-multilingual',
				description:
					'Convert multilingual text to speech using a named voice or a permitted audio reference.',
			},
		],
		displayOptions: {
			show: {
				operation: ['text_to_speech'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'elevenlabs-sfx',
		options: [
			{
				name: 'ElevenLabs SFX v2',
				value: 'elevenlabs-sfx',
				description:
					'Generate sound effects from a text description for videos and other audio projects.',
			},
			{
				name: 'Kling T2A',
				value: 'kling-t2a',
				description: 'Generate an audio clip from a text description for sound design.',
			},
			{
				name: 'Mirelo SFX 2.0 (Text to Audio)',
				value: 'mirelo-sfx-2.0-text-to-audio',
				description: 'Generate sound effects and soundscapes from a text prompt.',
			},
		],
		displayOptions: {
			show: {
				operation: ['generate_sound_effects'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'kling-v2a',
		options: [
			{
				name: 'Eleven Video to Music',
				value: 'eleven-video-to-music',
				description: 'Generate a music soundtrack that follows the action in a source video.',
			},
			{
				name: 'Kling V2A',
				value: 'kling-v2a',
				description: 'Create an audio track from a source video for video sound design.',
			},
			{
				name: 'Mirelo SFX 2.0 (Video to Audio)',
				value: 'mirelo-sfx-2.0-video-to-audio',
				description:
					'Generate an audio track synchronized to a source video for soundtrack editing.',
			},
		],
		displayOptions: {
			show: {
				operation: ['generate_audio_from_video'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'eleven-sts-v2',
		options: [
			{
				name: 'Eleven Multilingual STS v2',
				value: 'eleven-multilingual-sts-v2',
				description:
					'Change the speaker in multilingual audio while retaining timing and vocal expression.',
			},
			{
				name: 'Eleven STS v2',
				value: 'eleven-sts-v2',
				description:
					'Change the speaker in an audio recording while retaining timing and vocal expression.',
			},
		],
		displayOptions: {
			show: {
				operation: ['change_voice'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'eleven-audio-isolation',
		options: [
			{
				name: 'Eleven Audio Isolation',
				value: 'eleven-audio-isolation',
				description: 'Isolate vocals and reduce background noise in an audio recording.',
			},
		],
		displayOptions: {
			show: {
				operation: ['isolate_audio'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'eleven-dubbing',
		options: [
			{
				name: 'Eleven Dubbing',
				value: 'eleven-dubbing',
				description: 'Dub audio or video into another language with automatic voice matching.',
			},
		],
		displayOptions: {
			show: {
				operation: ['dub_audio'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'eleven-voice-design-v3',
		options: [
			{
				name: 'Eleven Voice Previews',
				value: 'eleven-voice-create',
				description:
					'Generate voice previews from a description to compare delivery before selecting a voice.',
			},
			{
				name: 'Eleven Voice Design Multilingual v2',
				value: 'eleven-voice-design-v2',
				description: 'Design a multilingual voice from a text description for voiceover previews.',
			},
			{
				name: 'Eleven Voice Design v3',
				value: 'eleven-voice-design-v3',
				description:
					'Design a voice from a text description for narration and character voice previews.',
			},
		],
		displayOptions: {
			show: {
				operation: ['design_voice'],
			},
		},
	},
);
for (const [model, schema] of Object.entries(schemas)) {
	const operations = Object.keys(groups).filter((k) => groups[k].models.includes(model));
	const advanced: INodeProperties[] = [];
	for (const [key, spec] of Object.entries(schema)) {
		const f = field(key, spec);
		if (key === 'prompt' || spec.required) {
			f.required = true;
			f.displayOptions = { show: { model: [model], operation: operations } };
			properties.push(f);
		} else advanced.push(f);
	}
	if (advanced.length)
		properties.push({
			displayName: 'Advanced',
			name: 'advanced',
			type: 'collection',
			placeholder: 'Add option',
			default: {},
			options: advanced,
			displayOptions: { show: { model: [model], operation: operations } },
			description: 'Optional settings supported by the selected model',
		});
}
function mediaUrl(value: unknown): string {
	if (typeof value !== 'string') throw new ApplicationError('A media URL is required.');
	const u = new URL(value);
	if (u.protocol !== 'https:' || u.username || u.password)
		throw new ApplicationError('Use an HTTPS media URL without embedded credentials.');
	return value;
}
function resultUrls(result: { url?: unknown; items?: unknown } | undefined): string[] {
	if (!result || typeof result !== 'object' || Array.isArray(result))
		throw new ApplicationError('Invalid audio result.');
	const urls: string[] = [];
	if (result.url !== undefined) urls.push(mediaUrl(result.url));
	if (result.items !== undefined) {
		if (!Array.isArray(result.items)) throw new ApplicationError('Invalid audio result items.');
		for (const item of result.items) urls.push(mediaUrl(item?.url));
	}
	if (!urls.length) throw new ApplicationError('Completed audio result contains no media.');
	return [...new Set(urls)];
}
export class PicsartAudio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Audio',
		name: 'picsartAudio',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		description:
			'Generate music, speech, and sound effects, transform audio, or check a saved audio task',
		defaults: { name: 'Picsart Audio' },
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		credentials: [{ name: 'picsartOAuth2Api', required: true }],
		properties,
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const outputs: INodeExecutionData[] = [];
		for (let i = 0; i < this.getInputData().length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				if (operation === 'get_audio_result') {
					const id = this.getNodeParameter('taskId', i) as string;
					if (typeof id !== 'string' || !id.trim() || id.length > 512)
						throw new ApplicationError('A saved task ID is required.');
					const envelope = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'picsartOAuth2Api',
						{
							method: 'GET',
							url: baseUrl + '/' + encodeURIComponent(id) + '/result',
							headers: { Accept: 'application/json' },
						},
					);
					const r = envelope?.response;
					if (envelope?.status !== 'success' || !r)
						throw new ApplicationError('Invalid audio result response.');
					if (r.id !== undefined && r.id !== id)
						throw new ApplicationError('Audio result task ID does not match the requested task.');
					if (['FAILED', 'CANCELED', 'CANCELLED'].includes(r.status))
						throw new ApplicationError(
							'Audio generation failed. Review the saved task before resubmitting.',
						);
					if (
						![
							'SUBMITTED',
							'PENDING',
							'QUEUED',
							'PROCESSING',
							'RUNNING',
							'IN_PROGRESS',
							'COMPLETED',
						].includes(r.status)
					)
						throw new ApplicationError('Unknown audio job status.');
					const completed = r.status === 'COMPLETED';
					const urls = completed ? resultUrls(r.result) : undefined;
					outputs.push({
						json: {
							task_id: id,
							status: r.status,
							completed,
							...(completed
								? {
										url: urls![0],
										urls,
										...(r.result.items !== undefined ? { items: r.result.items } : {}),
										result: r.result,
									}
								: {}),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				const model = this.getNodeParameter('model', i) as string;
				if (!groups[operation]?.models.includes(model))
					throw new ApplicationError('Choose a model supported by this audio operation.');
				const schema = schemas[model];
				const params: Record<string, unknown> = {
					...(this.getNodeParameter('advanced', i, {}) as Record<string, unknown>),
				};
				for (const [key, spec] of Object.entries(schema))
					if (key === 'prompt' || spec.required) params[key] = this.getNodeParameter(key, i);
				for (const [key, value] of Object.entries(params)) {
					const spec = schema[key];
					if (!spec) throw new ApplicationError('Unsupported parameter ' + key);
					if (spec.type === 'file') {
						if (spec.max) {
							const values =
								typeof value === 'string'
									? value
											.split(/\r?\n/)
											.map((s) => s.trim())
											.filter(Boolean)
									: value;
							if (!Array.isArray(values) || !values.length || values.length > spec.max)
								throw new ApplicationError('Invalid media count for ' + key);
							params[key] = values.map(mediaUrl);
						} else params[key] = mediaUrl(value);
					} else {
						if (typeof value !== spec.type) throw new ApplicationError('Invalid type for ' + key);
						if (typeof value === 'string' && (key === 'prompt' || spec.required) && !value.trim())
							throw new ApplicationError('Missing ' + key);
						if (spec.enum && !spec.enum.includes(value as string | number))
							throw new ApplicationError('Invalid choice for ' + key);
						if (
							typeof value === 'number' &&
							(!Number.isFinite(value) ||
								value < (spec.min ?? -Infinity) ||
								value > (spec.max ?? Infinity))
						)
							throw new ApplicationError('Invalid range for ' + key);
					}
				}
				const data = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'picsartOAuth2Api',
					{
						method: 'POST',
						url: baseUrl + '/submit',
						headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
						body: { params: { model, params } },
					},
				);
				if (
					data?.status !== 'success' ||
					typeof data.response?.id !== 'string' ||
					!data.response.id.trim() ||
					data.response.id.length > 512
				)
					throw new ApplicationError(
						'Submission was not confirmed. Do not automatically resubmit.',
					);
				outputs.push({
					json: {
						task_id: data.response.id,
						status: data.response.status || 'SUBMITTED',
						completed: false,
						model,
						operation,
						resolved_parameters: params as never,
					},
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail())
					outputs.push({
						json: { error: error instanceof Error ? error.message : 'Audio operation failed' },
						pairedItem: { item: i },
					});
				else throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}
		return [outputs];
	}
}
