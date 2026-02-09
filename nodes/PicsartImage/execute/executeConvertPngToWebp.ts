import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';

export async function executeConvertPngToWebp(
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

			// Validate that the input is a PNG image
			const isPng = mimeType === 'image/png' || 
				fileName.toLowerCase().endsWith('.png') ||
				binaryData.fileExtension?.toLowerCase() === 'png';
			
			if (!isPng) {
				throw new NodeOperationError(
					context.getNode(),
					`Input image must be in PNG format. Current format: ${mimeType || 'unknown'}`,
					{ itemIndex }
				);
			}
		} catch (error) {
			if (error instanceof NodeOperationError) {
				throw error;
			}
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

		// Validate that the URL points to a PNG image
		const urlLower = imageUrl.toLowerCase();
		if (!urlLower.endsWith('.png') && !urlLower.includes('.png?')) {
			throw new NodeOperationError(
				context.getNode(),
				'Image URL must point to a PNG image (should end with .png)',
				{ itemIndex }
			);
		}
	}

	// Prepare form data for conversion
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

	formFields.format = 'WEBP';

	const multipart = buildMultipartFormData(formFields);
	
	try {
		// Call Picsart API to convert image
		const result = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://api.picsart.io/tools/1.0/edit',
				headers: {
					Accept: 'application/json',
					'Content-Type': multipart.contentType,
				},
				body: multipart.body,
			},
		);

		// Download the converted image
		const imageBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: result?.data?.url,
			encoding: 'arraybuffer',
		});

		// Return converted image data
		returnData.push({
			binary: {
				data: await context.helpers.prepareBinaryData(imageBuffer, 'converted-image.webp'),
			},
			json: {
				imageSource: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
				format: 'WEBP',
				result,
			},
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}
}
