import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';

export async function executeHashtag(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get resource type
	const resource: string = context.getNodeParameter('resource', itemIndex) as string;
	
	// Get parameters
	const inputBinaryField: string = context.getNodeParameter('inputBinaryField', itemIndex, '') as string;
	const imageUrl: string = context.getNodeParameter('image_url', itemIndex, '') as string;

	// Check if binary data exists (only if resource is DATA)
	let binaryDataBuffer = null;
	let fileName = 'image.png';
	let mimeType = 'image/png';
	
	if (resource === 'DATA') {
		if (!inputBinaryField) {
			throw new NodeOperationError(
				context.getNode(),
				'Input Binary Field is required when using Binary Image resource',
				{ itemIndex }
			);
		}
		try {
			// Get binary data metadata using assertBinaryData
			const binaryData = context.helpers.assertBinaryData(itemIndex, inputBinaryField);
			binaryDataBuffer = await context.helpers.getBinaryDataBuffer(itemIndex, inputBinaryField);
			fileName = binaryData.fileName || (binaryData.fileExtension ? `image.${binaryData.fileExtension}` : 'image.png');
			mimeType = binaryData.mimeType || 'image/png';
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Binary data not found in field "${inputBinaryField}". Please ensure the previous node provides binary data.`,
				{ itemIndex }
			);
		}
	} else if (resource === 'Image URL') {
		if (!imageUrl) {
			throw new NodeOperationError(
				context.getNode(),
				'Image URL is required when using Image URL resource',
				{ itemIndex }
			);
		}
	}

	// Prepare form data for hashtag generation
	const formFields: Record<string, string | { data: any; filename?: string; contentType?: string }> = {};

	if (binaryDataBuffer) {
		// Send binary file
		formFields.image = {
			data: binaryDataBuffer,
			filename: fileName,
			contentType: mimeType,
		};
	} else {
		// Send image URL (only when no binary data)
		formFields.image_url = imageUrl;
	}

	const multipart = buildMultipartFormData(formFields);
	let result = null;
	
	try {
		// Call Picsart API to generate hashtags
		result = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://api.picsart.io/tools/1.0/tags',
				headers: {
					Accept: 'application/json',
					'Content-Type': multipart.contentType,
				},
				body: multipart.body,
			},
		);
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}

	// Return hashtag results
	// Extract hashtags from the result
	const hashtags = result?.data?.tags || result?.tags || result?.data || [];
	
	returnData.push({
		json: {
			imageSource: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
			hashtags,
			hashtagCount: Array.isArray(hashtags) ? hashtags.length : 0,
			status: result?.status || 'success',
			result,
		},
		pairedItem: itemIndex,
	});
}
