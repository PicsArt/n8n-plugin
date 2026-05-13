import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export const maxPaintingPollAttempts = 600;

/** GET https://genai-api.picsart.io/v1/painting/{inference_id} */
export function paintingInferenceUrl(inferenceId: string): string {
	return `https://genai-api.picsart.io/v1/painting/${inferenceId}`;
}

/** Image URLs from a painting GET response or a synchronous POST body when `data[].url` is present. */
export function extractPaintingImageUrls(result: any, maxCount: number): string[] {
	if (!result) return [];
	if (Array.isArray(result.data) && result.data.length > 0) {
		return result.data
			.slice(0, maxCount)
			.map((item: any) => item?.url)
			.filter((url: string) => url);
	}
	if (result.data?.url) return [result.data.url];
	if (result.url) return [result.url];
	return [];
}

/**
 * Poll GET /v1/painting/{inference_id} until image URLs are ready (same pattern as text2image).
 */
export async function pollUntilPaintingImagesReady(
	context: IExecuteFunctions,
	inferenceId: string,
	maxCount: number,
	itemIndex: number,
): Promise<{ imageUrls: string[]; result: any }> {
	let result: any;
	let pollAttempts = 0;
	let imageUrls: string[] = [];

	while (pollAttempts < maxPaintingPollAttempts) {
		try {
			result = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
				method: 'GET',
				url: paintingInferenceUrl(inferenceId),
				headers: { Accept: 'application/json' },
			});
			if (result.status === 'completed' || result.status === 'success') {
				imageUrls = extractPaintingImageUrls(result, maxCount);
				if (imageUrls.length > 0) {
					break;
				}
			}

			if (result.status === 'failed' || result.status === 'error') {
				throw new NodeOperationError(
					context.getNode(),
					`Painting edit failed: ${result.message || result.error || result.data?.message || 'Unknown error'}`,
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

	if (imageUrls.length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			`Painting edit timed out after ${maxPaintingPollAttempts} polling attempts. Inference ID: ${inferenceId}. Last response: ${JSON.stringify(result)}. The image may still be processing — try again shortly or contact support if the issue persists.`,
			{ itemIndex },
		);
	}

	return { imageUrls, result };
}
