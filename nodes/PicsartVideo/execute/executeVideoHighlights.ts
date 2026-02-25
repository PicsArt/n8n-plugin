import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import type { VideoApiResult, HttpError } from './types';

const HIGHLIGHTS_API_URL = 'https://video-api.picsart.io/v1/concat/highlights';
const VIDEO_RESULT_URL = 'https://video-api.picsart.io/v1/video';
const maxPollAttempts = 600;


export async function executeVideoHighlights(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const videoUrl = context.getNodeParameter('videoUrl', itemIndex) as string;
	const trimSegmentsParam = context.getNodeParameter('trimSegments', itemIndex) as {
		segment?: Array<{ start?: number; end?: number }>;
	};
	const mode = context.getNodeParameter('mode', itemIndex, 'simple') as string;
	let format: string;
	let frameRate: number;
	let bitrate: number | undefined;
	if (mode === 'advanced') {
		format = context.getNodeParameter('exportFormat', itemIndex, 'MP4') as string;
		frameRate = context.getNodeParameter('exportFrameRate', itemIndex, 30) as number;
		bitrate = context.getNodeParameter('exportBitrate', itemIndex, undefined) as number | undefined;
	} else {
		format = 'MP4';
		frameRate = 30;
		bitrate = undefined;
	}

	const segments = trimSegmentsParam?.segment ?? [];
	const trim_segments = segments
		.filter((s) => s != null && typeof s.start === 'number' && typeof s.end === 'number')
		.map((s) => ({ start: Number(s.start), end: Number(s.end) }));

	if (trim_segments.length < 2 || trim_segments.length > 10) {
		throw new NodeOperationError(
			context.getNode(),
			'Trim segments must contain between 2 and 10 segments (each with start and end in ms).',
			{ itemIndex },
		);
	}

	for (const seg of trim_segments) {
		if (seg.start < 0) {
			throw new NodeOperationError(
				context.getNode(),
				`Segment start must be >= 0 (ms). Got: ${seg.start}`,
				{ itemIndex },
			);
		}
		if (seg.end < 1) {
			throw new NodeOperationError(
				context.getNode(),
				`Segment end must be >= 1 (ms). Got: ${seg.end}`,
				{ itemIndex },
			);
		}
		if (seg.end <= seg.start) {
			throw new NodeOperationError(
				context.getNode(),
				`Segment end must be greater than start. Got start=${seg.start}, end=${seg.end}`,
				{ itemIndex },
			);
		}
	}

	if (!videoUrl || videoUrl.trim().length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Video URL is required',
			{ itemIndex },
		);
	}

	if (videoUrl.length > 2083) {
		throw new NodeOperationError(
			context.getNode(),
			'Video URL must be at most 2083 characters',
			{ itemIndex },
		);
	}

	try {
		const exportParams: Record<string, string | number> = {
			format,
			frame_rate: frameRate,
		};
		if (bitrate != null && bitrate >= 1 && bitrate <= 10000) {
			exportParams.bitrate = bitrate;
		}

		const body = {
			video_url: videoUrl,
			trim_segments,
			export: exportParams,
		};

		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: HIGHLIGHTS_API_URL,
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body,
			},
		);

		const transactionId =
			response.transaction_id ?? response.inference_id ?? response.id ?? response.job_id;

		if (!transactionId) {
			const resultUrl = response.data?.url ?? response.url ?? response.result?.url;
			if (resultUrl) {
				const videoBuffer = await context.helpers.httpRequest({
					method: 'GET',
					url: resultUrl,
					encoding: 'arraybuffer',
				});
				returnData.push({
					binary: {
						data: await context.helpers.prepareBinaryData(
							videoBuffer,
							'highlights-video.mp4',
							'video/mp4',
						),
					},
					json: {
						videoUrl: resultUrl,
						video_url: videoUrl,
						trim_segments,
						export: exportParams,
					},
				});
				return;
			}
			throw new NodeOperationError(
				context.getNode(),
				`Unexpected API response: no transaction_id or result URL. Response: ${JSON.stringify(response)}`,
				{ itemIndex },
			);
		}

		let pollAttempts = 0;
		let result: VideoApiResult = response as VideoApiResult;

		while (pollAttempts < maxPollAttempts) {
			try {
				result = await context.helpers.httpRequestWithAuthentication.call(
					context,
					'picsartApi',
					{
						method: 'GET',
						url: `${VIDEO_RESULT_URL}/${transactionId}`,
						headers: { Accept: 'application/json' },
					},
				);
			} catch (err: unknown) {
				const httpErr = err as HttpError;
				if (httpErr.statusCode === 404 || httpErr.response?.status === 404) {
					pollAttempts++;
					continue;
				}
				throw err;
			}

			if (result.status === 'success' && result.data?.url) {
				const resultVideoUrl = result.data.url;
				const videoBuffer = await context.helpers.httpRequest({
					method: 'GET',
					url: resultVideoUrl,
					encoding: 'arraybuffer',
				});
				returnData.push({
					binary: {
						data: await context.helpers.prepareBinaryData(
							videoBuffer,
							'highlights-video.mp4',
							'video/mp4',
						),
					},
					json: {
						videoUrl: resultVideoUrl,
						video_url: videoUrl,
						transactionId,
						trim_segments,
						export: exportParams,
					},
				});
				return;
			}

			if (result.status === 'error' || result.status === 'failed') {
				throw new NodeOperationError(
					context.getNode(),
					`Video highlights failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
					{ itemIndex },
				);
			}

			pollAttempts++;
		}

		throw new NodeOperationError(
			context.getNode(),
			`Video highlights timed out after ${maxPollAttempts} polling attempts. Transaction ID: ${transactionId}.`,
			{ itemIndex },
		);
	} catch (error: unknown) {
		handleApiError(context, error, itemIndex);
	}
}

