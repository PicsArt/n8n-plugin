import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';
import { extractPaintingImageUrls, pollUntilPaintingImagesReady } from './pollPaintingInference';

const PAINTING_EDIT_URL = 'https://genai-api.picsart.io/v1/painting/edit';

function fileExtensionForFormat(format: string): string {
	const u = String(format).toUpperCase();
	if (u === 'PNG') return 'png';
	if (u === 'WEBP') return 'webp';
	return 'jpg';
}

export async function executePaintingEdit(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const resource = context.getNodeParameter('paintingEditResource', itemIndex, 'Image URL') as string;
	const prompt = context.getNodeParameter('paintingEditPrompt', itemIndex) as string;
	const count = context.getNodeParameter('paintingEditCount', itemIndex, 2) as number;
	const format = context.getNodeParameter('paintingEditFormat', itemIndex, 'JPG') as string;
	const mode = context.getNodeParameter('paintingEditMode', itemIndex, 'sync') as string;
	const model = context.getNodeParameter('paintingEditModel', itemIndex) as string;

	if (!prompt?.trim()) {
		throw new NodeOperationError(context.getNode(), 'Prompt is required and cannot be empty', { itemIndex });
	}
	if (count < 1 || count > 10) {
		throw new NodeOperationError(context.getNode(), 'Count must be between 1 and 10', { itemIndex });
	}

	const formFields: Record<string, string | { data: Buffer; filename?: string; contentType?: string }> = {
		prompt: prompt.trim(),
		count: String(count),
		format,
		mode,
		model,
	};

	const normalizedResource = String(resource).trim().toLowerCase();
	const useBinarySource = normalizedResource === 'data' || normalizedResource === 'binary image';

	if (useBinarySource) {
		const field = context.getNodeParameter('paintingEditInputBinaryField', itemIndex, '') as string;
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
		const currentUrl = context.getNodeParameter('paintingEditImageUrl', itemIndex, '') as string;
		const legacyUrl = context.getNodeParameter('image_url', itemIndex, '') as string;
		const imageUrl = String(currentUrl || legacyUrl || '').trim();
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
	const ext = fileExtensionForFormat(format);

	try {
		const submitResponse = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
			method: 'POST',
			url: PAINTING_EDIT_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': contentType,
			},
			body,
		});

		let imageUrls = extractPaintingImageUrls(submitResponse, count);
		let result: any = submitResponse;
		let inferenceId: string | undefined =
			submitResponse.inference_id || submitResponse.transactionId || submitResponse.transaction_id;

		// Async: top-level `id` is the inference / transaction id (not the same as asset ids inside data[]).
		if (!imageUrls.length && !inferenceId && typeof submitResponse.id === 'string') {
			const id = submitResponse.id as string;
			if (!id.includes('.') && id.length >= 8) {
				inferenceId = id;
			}
		}

		if (!imageUrls.length) {
			if (!inferenceId) {
				throw new NodeOperationError(
					context.getNode(),
					'Could not get image URLs or inference ID from API response. Response: ' + JSON.stringify(submitResponse),
					{ itemIndex },
				);
			}
			const polled = await pollUntilPaintingImagesReady(context, inferenceId, count, itemIndex);
			imageUrls = polled.imageUrls;
			result = polled.result;
		}

		for (let i = 0; i < imageUrls.length; i++) {
			const imageUrl = imageUrls[i];
			const imageBuffer = await context.helpers.httpRequest({
				method: 'GET',
				url: imageUrl,
				encoding: 'arraybuffer',
			});

			returnData.push({
				binary: {
					data: await context.helpers.prepareBinaryData(imageBuffer, `edited-image-${i + 1}.${ext}`),
				},
				json: {
					prompt: prompt.trim(),
					count: imageUrls.length,
					format,
					mode,
					model,
					imageIndex: i + 1,
					...(inferenceId ? { inferenceId } : {}),
					imageUrl,
					result,
				},
				pairedItem: itemIndex,
			});
		}
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}
}
