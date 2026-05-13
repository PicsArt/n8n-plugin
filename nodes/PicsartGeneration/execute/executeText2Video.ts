import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import { pollUntilVideoReady } from './pollVideoInference';

const TEXT2VIDEO_SUBMIT_URL = 'https://genai-api.picsart.io/v1/text2video';

export async function executeText2Video(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const prompt = context.getNodeParameter('text2VideoPrompt', itemIndex) as string;
	const width = context.getNodeParameter('text2VideoWidth', itemIndex, 1024) as number;
	const height = context.getNodeParameter('text2VideoHeight', itemIndex, 1024) as number;
	const quality = context.getNodeParameter('text2VideoQuality', itemIndex, '480p') as string;
	const audio = context.getNodeParameter('text2VideoAudio', itemIndex, false) as boolean;
	const videoLength = context.getNodeParameter('text2VideoLength', itemIndex, 3) as number;
	const model = context.getNodeParameter('text2VideoModel', itemIndex) as string;

	if (!prompt?.trim()) {
		throw new NodeOperationError(context.getNode(), 'Prompt is required and cannot be empty', { itemIndex });
	}
	if (width < 64 || width > 1024) {
		throw new NodeOperationError(context.getNode(), 'Width must be between 64 and 1024 pixels', { itemIndex });
	}
	if (height < 64 || height > 1024) {
		throw new NodeOperationError(context.getNode(), 'Height must be between 64 and 1024 pixels', { itemIndex });
	}
	if (videoLength < 1 || videoLength > 20) {
		throw new NodeOperationError(context.getNode(), 'Video length must be between 1 and 20 seconds', { itemIndex });
	}

	try {
		const submitResponse = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
			method: 'POST',
			url: TEXT2VIDEO_SUBMIT_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: {
				prompt: prompt.trim(),
				width,
				height,
				quality,
				audio,
				length: videoLength,
				model,
			},
		});

		const inferenceId = submitResponse.inference_id || submitResponse.id || submitResponse.transactionId;
		if (!inferenceId) {
			throw new NodeOperationError(
				context.getNode(),
				'Failed to get inference ID from API response. Response: ' + JSON.stringify(submitResponse),
				{ itemIndex },
			);
		}

		const { videoUrl, result } = await pollUntilVideoReady(context, inferenceId, itemIndex);

		const videoBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: videoUrl,
			encoding: 'arraybuffer',
		});

		returnData.push({
			binary: {
				data: await context.helpers.prepareBinaryData(videoBuffer, 'generated-video.mp4'),
			},
			json: {
				prompt: prompt.trim(),
				width,
				height,
				quality,
				audio,
				videoLength,
				model,
				inferenceId,
				videoUrl,
				result,
			},
			pairedItem: itemIndex,
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}
}
