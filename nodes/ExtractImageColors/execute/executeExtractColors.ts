import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';

const EXTRACT_COLORS_API_URL = 'https://api.picsart.io/tools/1.0/extract-colors';

export async function executeExtractColors(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const resource: string = context.getNodeParameter('resource', itemIndex) as string;
	const inputBinaryField: string = context.getNodeParameter('inputBinaryField', itemIndex, '') as string;
	const imageUrl: string = context.getNodeParameter('image_url', itemIndex, '') as string;

	let binaryDataBuffer: Buffer | null = null;
	let fileName = 'image.png';
	let mimeType = 'image/png';

	if (resource === 'DATA') {
		if (!inputBinaryField) {
			throw new NodeOperationError(
				context.getNode(),
				'Input Binary Field is required when using Binary Image resource',
				{ itemIndex },
			);
		}
		try {
			context.helpers.assertBinaryData(itemIndex, inputBinaryField);
			binaryDataBuffer = await context.helpers.getBinaryDataBuffer(itemIndex, inputBinaryField);
			const binaryData = context.getInputData()[itemIndex].binary![inputBinaryField];
			fileName = binaryData.fileName || (binaryData.fileExtension ? `image.${binaryData.fileExtension}` : 'image.png');
			mimeType = binaryData.mimeType || 'image/png';
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Binary data not found in field "${inputBinaryField}". Please ensure the previous node provides binary data.`,
				{ itemIndex },
			);
		}
	} else if (resource === 'Image URL') {
		if (!imageUrl || imageUrl.length < 1 || imageUrl.length > 2083) {
			throw new NodeOperationError(
				context.getNode(),
				'Image URL is required and must be between 1 and 2083 characters when using Image URL resource',
				{ itemIndex },
			);
		}
	}

	const formFields: Record<string, string | { data: Buffer; filename?: string; contentType?: string }> = {};

	if (binaryDataBuffer) {
		formFields.image = {
			data: binaryDataBuffer,
			filename: fileName,
			contentType: mimeType,
		};
	} else {
		formFields.image_url = imageUrl;
	}

	const { body, contentType } = buildMultipartFormData(formFields);
	let result: any;

	try {
		result = await context.helpers.httpRequestWithAuthentication.call(context, 'picsartApi', {
			method: 'POST',
			url: EXTRACT_COLORS_API_URL,
			headers: {
				'Content-Type': contentType,
				Accept: 'application/json',
			},
			body,
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}

	returnData.push({
		json: {
			colors: result?.data?.colors ?? result?.colors ?? result?.data ?? result,
			imageSource: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
			result,
		},
		pairedItem: itemIndex,
	});
}
