import type { INodeProperties } from 'n8n-workflow';

const videoCodecOptions = [
	{ name: 'Keep the Same', value: 'default' },
	{ name: 'HEVC', value: 'HEVC' },
	{ name: 'H264', value: 'h264' },
	{ name: 'Theora', value: 'theora' },
	{ name: 'Vp8', value: 'vp8' },
	{ name: 'Vp9', value: 'vp9' },
	{ name: 'gif', value: 'gif' },
	{ name: 'Av1', value: 'av1' },
	{ name: 'Cinepak', value: 'cinepak' },
	{ name: 'Ffv1', value: 'ffv1' },
	{ name: 'MPEG4', value: 'MPEG4' },
	{ name: 'Vc2', value: 'vc2' },
];

const audioCodecOptions = [
	{ name: 'Keep the Same', value: 'default' },
	{ name: 'Aac', value: 'aac' },
	{ name: 'Ac3', value: 'ac3' },
	{ name: 'Opus', value: 'opus' },
	{ name: 'Mp3', value: 'mp3' },
	{ name: 'Ogg_vorbis', value: 'ogg_vorbis' },
	{ name: 'Ogg_speex', value: 'ogg_speex' },
	{ name: 'Wav', value: 'wav' },
	{ name: 'Flac', value: 'flac' },
	{ name: 'PCM', value: 'PCM' },
];

const colorSpaceOptions = [
	{ name: 'SRGB', value: 'SRGB' },
	{ name: 'DisplayP3', value: 'DisplayP3' },
];

const formatOptions = [
	{ name: 'MP4', value: 'MP4' },
	{ name: 'MOV', value: 'MOV' },
	{ name: 'WEBM', value: 'WEBM' },
];


export const compressVideoProperties: INodeProperties[] = [
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
				operation: ['Compress video to size'],
			},
		},
	},
	{
		displayName: 'Maximum Size in MB',
		name: 'max_size_mb',
		type: 'number',
		required: true,
		default: 80,
		description: 'The maximum target size in megabytes (not strict)',
		displayOptions: {
			show: {
				operation: ['Compress video to size'],
			},
		},
	},
	{
		displayName: 'Codec',
		name: 'codec',
		type: 'options',
		default: 'default',
		description: 'The video codec. Use "default" to keep the video codec the same.',
		displayOptions: {
			show: {
				operation: ['Compress video to size'],
				mode: ['advanced'],
			},
		},
		options: videoCodecOptions,
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		default: 'MP4',
		description: 'Output video format (container)',
		displayOptions: {
			show: {
				operation: ['Compress video to size'],
				mode: ['advanced'],
			},
		},
		options: formatOptions,
	},
	{
		displayName: 'Audio Codec',
		name: 'audioCodec',
		type: 'options',
		default: 'default',
		description: 'Audio codec. Use "Default" to keep the same.',
		displayOptions: {
			show: {
				operation: ['Compress video to size'],
				mode: ['advanced'],
			},
		},
		options: audioCodecOptions,
	},
	{
		displayName: 'Bitrate (Kb/s)',
		name: 'bitrate',
		type: 'number',
		default: null,
		description: 'The output video bitrate in kb/s. Leave empty to set automatically and optimize accordingly.',
		typeOptions: {
			minValue: 1,
			maxValue: 10000,
		},
		displayOptions: {
			show: {
				operation: ['Compress video to size'],
				mode: ['advanced'],
			},
		},
	},
	{
		displayName: 'Color Space',
		name: 'colorSpace',
		type: 'options',
		default: 'SRGB',
		description: 'Color space of the output video',
		displayOptions: {
			show: {
				operation: ['Compress video to size'],
				mode: ['advanced'],
			},
		},
		options: colorSpaceOptions,
	},
];
