import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export const maxAudioPollAttempts = 600;

/** GET https://genai-api.picsart.io/v1/audio/{inference_id} */
export function audioInferenceUrl(inferenceId: string): string {
	return `https://genai-api.picsart.io/v1/audio/${inferenceId}`;
}

/**
 * Poll until a downloadable audio URL is available (same pattern as video/text2image status polling).
 */
export async function pollUntilAudioReady(
	context: IExecuteFunctions,
	inferenceId: string,
	itemIndex: number,
): Promise<{ audioUrl: string; result: any }> {
	let result: any;
	let pollAttempts = 0;
	let audioUrl: string | null = null;

	while (pollAttempts < maxAudioPollAttempts) {
		try {
			result = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
				method: 'GET',
				url: audioInferenceUrl(inferenceId),
				headers: { Accept: 'application/json' },
			});
			if (result.status === 'completed' || result.status === 'success') {
				if (Array.isArray(result.data) && result.data.length > 0) {
					const u = result.data.map((item: any) => item?.url).find((url: string) => url);
					if (u) {
						audioUrl = u;
						break;
					}
				} else if (result.data?.url) {
					audioUrl = result.data.url;
					break;
				} else if (result.url) {
					audioUrl = result.url;
					break;
				}
			}

			if (result.status === 'failed' || result.status === 'error') {
				throw new NodeOperationError(
					context.getNode(),
					`Audio generation failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
					{ itemIndex },
				);
			}

			pollAttempts++;
		} catch (error: any) {
			if (error.statusCode === 404 || error.response?.status === 404) {
				pollAttempts++;
				continue;
			}
			throw error;
		}
	}

	if (!audioUrl) {
		throw new NodeOperationError(
			context.getNode(),
			`Audio generation timed out after ${maxAudioPollAttempts} polling attempts. Inference ID: ${inferenceId}. Last response: ${JSON.stringify(result)}. The audio may still be processing — try again shortly or contact support if the issue persists.`,
			{ itemIndex },
		);
	}

	return { audioUrl, result };
}
