import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';
import { pollUntilVideoReady } from './pollVideoInference';

const IMAGE2VIDEO_SUBMIT_URL = 'https://genai-api.picsart.io/v1/image2video';

export async function executeImage2Video(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const resource = context.getNodeParameter('image2VideoResource', itemIndex, 'Image URL') as string;
	const prompt = context.getNodeParameter('image2VideoPrompt', itemIndex) as string;
	const width = context.getNodeParameter('image2VideoWidth', itemIndex, 1024) as number;
	const height = context.getNodeParameter('image2VideoHeight', itemIndex, 1024) as number;
	const quality = context.getNodeParameter('image2VideoQuality', itemIndex, '480p') as string;
	const audio = context.getNodeParameter('image2VideoAudio', itemIndex, false) as boolean;
	const videoLength = context.getNodeParameter('image2VideoLength', itemIndex, 3) as number;
	const model = context.getNodeParameter('image2VideoModel', itemIndex) as string;
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

	const formFields: Record<string, string | { data: Buffer; filename?: string; contentType?: string }> = {
		prompt: prompt.trim(),
		width: String(width),
		height: String(height),
		quality,
		audio: audio ? 'true' : 'false',
		length: String(videoLength),
		model,
	};

	const normalizedResource = String(resource).trim().toLowerCase();
	const useBinarySource = normalizedResource === 'data' || normalizedResource === 'binary image';

	if (useBinarySource) {
		const field = context.getNodeParameter('image2VideoInputBinaryField', itemIndex, '') as string;
		if (!field) {
			throw new NodeOperationError(context.getNode(), 'Input Binary Field is required when using Binary Image', { itemIndex });
		}
		try {
			context.helpers.assertBinaryData(itemIndex, field);
			const buf = await context.helpers.getBinaryDataBuffer(itemIndex, field);
			const meta = context.getInputData()[itemIndex].binary![field];
			const filename = meta.fileName || (meta.fileExtension ? `image.${meta.fileExtension}` : 'image.png');
			const mimeType = meta.mimeType || 'image/png';
			formFields.image = { data: buf, filename, contentType: mimeType };
		} catch {
			throw new NodeOperationError(
				context.getNode(),
				`Binary data not found in field "${field}". Ensure a previous node outputs binary data to this property.`,
				{ itemIndex },
			);
		}
	} else {
		// Fallback to legacy parameter name for older workflows.
		const currentImageUrl = context.getNodeParameter('image2VideoImageUrl', itemIndex, '') as string;
		const legacyImageUrl = context.getNodeParameter('image_url', itemIndex, '') as string;
		const imageUrl = String(currentImageUrl || legacyImageUrl || '').trim();
		if (!imageUrl || imageUrl.length < 1 || imageUrl.length > 2083) {
			throw new NodeOperationError(
				context.getNode(),
				'Image URL is required and must be between 1 and 2083 characters when using Image URL resource',
				{ itemIndex },
			);
		}
		formFields.image_url = imageUrl;
	}
	const { body, contentType } = buildMultipartFormData(formFields);

	try {
		const submitResponse = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
			method: 'POST',
			url: IMAGE2VIDEO_SUBMIT_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': contentType,
			},
			body,
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
