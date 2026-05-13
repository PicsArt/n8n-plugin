import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export const maxVideoPollAttempts = 600;

/** GET https://genai-api.picsart.io/v1/video/{inference_id} */
export function videoInferenceUrl(inferenceId: string): string {
	return `https://genai-api.picsart.io/v1/video/${inferenceId}`;
}

/**
 * Poll until a downloadable video URL is available (same pattern as text2image status polling).
 */
export async function pollUntilVideoReady(
	context: IExecuteFunctions,
	inferenceId: string,
	itemIndex: number,
): Promise<{ videoUrl: string; result: any }> {
	let result: any;
	let pollAttempts = 0;
	let videoUrl: string | null = null;

	while (pollAttempts < maxVideoPollAttempts) {
		try {
			result = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
				method: 'GET',
				url: videoInferenceUrl(inferenceId),
				headers: { Accept: 'application/json' },
			});
			if (result.status === 'completed' || result.status === 'success') {
				if (Array.isArray(result.data) && result.data.length > 0) {
					const u = result.data.map((item: any) => item?.url).find((url: string) => url);
					if (u) {
						videoUrl = u;
						break;
					}
				} else if (result.data?.url) {
					videoUrl = result.data.url;
					break;
				} else if (result.url) {
					videoUrl = result.url;
					break;
				}
			}

			if (result.status === 'failed' || result.status === 'error') {
				throw new NodeOperationError(
					context.getNode(),
					`Video generation failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
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

	if (!videoUrl) {
		throw new NodeOperationError(
			context.getNode(),
			`Video generation timed out after ${maxVideoPollAttempts} polling attempts. Inference ID: ${inferenceId}. Last response: ${JSON.stringify(result)}. The video may still be processing — try again shortly or contact support if the issue persists.`,
			{ itemIndex },
		);
	}

	return { videoUrl, result };
}
