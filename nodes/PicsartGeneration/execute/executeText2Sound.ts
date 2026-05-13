import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import { pollUntilAudioReady } from './pollAudioInference';

const TEXT2SOUND_SUBMIT_URL = 'https://genai-api.picsart.io/v1/text2sound';

export async function executeText2Sound(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const promptRaw = context.getNodeParameter('text2SoundPrompt', itemIndex) as string;
	const prompt = String(promptRaw ?? '').trim();
	const duration = context.getNodeParameter('text2SoundDuration', itemIndex, 0) as number;
	const loop = context.getNodeParameter('text2SoundLoop', itemIndex, false) as boolean;
	const model = context.getNodeParameter('text2SoundModel', itemIndex) as string;

	if (!prompt) {
		throw new NodeOperationError(context.getNode(), 'Prompt is required and cannot be empty', { itemIndex });
	}

	const body: Record<string, string | number | boolean> = {
		prompt,
		loop,
		model,
	};

	if (duration > 0) {
		if (duration < 0.5 || duration > 22) {
			throw new NodeOperationError(
				context.getNode(),
				'Duration must be between 0.5 and 22 seconds when set, or use 0 for automatic duration.',
				{ itemIndex },
			);
		}
		body.duration = duration;
	}

	try {
		const submitResponse = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
			method: 'POST',
			url: TEXT2SOUND_SUBMIT_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
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

		const { audioUrl, result } = await pollUntilAudioReady(context, inferenceId, itemIndex);

		const audioBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: audioUrl,
			encoding: 'arraybuffer',
		});

		returnData.push({
			binary: {
				data: await context.helpers.prepareBinaryData(audioBuffer, 'generated-sound.mp3'),
			},
			json: {
				prompt,
				duration: duration > 0 ? duration : undefined,
				loop,
				model,
				inferenceId,
				audioUrl,
				result,
			},
			pairedItem: itemIndex,
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}
}
