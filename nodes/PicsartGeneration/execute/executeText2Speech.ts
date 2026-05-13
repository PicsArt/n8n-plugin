import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleApiError } from './errorHandler';
import { pollUntilAudioReady } from './pollAudioInference';

const TEXT2SPEECH_SUBMIT_URL = 'https://genai-api.picsart.io/v1/text2speech';
const maxTextLength = 5000;

export async function executeText2Speech(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const textRaw = context.getNodeParameter('text2SpeechText', itemIndex) as string;
	const text = String(textRaw ?? '').trim();
	const language = context.getNodeParameter('text2SpeechLanguage', itemIndex, 'en') as string;
	const model = context.getNodeParameter('text2SpeechModel', itemIndex) as string;
	const voiceRaw = context.getNodeParameter('text2SpeechVoice', itemIndex, '') as string;
	const voice = String(voiceRaw ?? '').trim();

	if (!text) {
		throw new NodeOperationError(context.getNode(), 'Text is required and cannot be empty', { itemIndex });
	}
	if (text.length > maxTextLength) {
		throw new NodeOperationError(
			context.getNode(),
			`Text must be at most ${maxTextLength} characters (currently ${text.length})`,
			{ itemIndex },
		);
	}

	const body: Record<string, string> = {
		text,
		language,
		model,
	};
	if (voice) {
		body.voice = voice;
	}

	try {
		const submitResponse = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
			method: 'POST',
			url: TEXT2SPEECH_SUBMIT_URL,
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
				data: await context.helpers.prepareBinaryData(audioBuffer, 'generated-speech.mp3'),
			},
			json: {
				text,
				language,
				model,
				voice: voice || undefined,
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
