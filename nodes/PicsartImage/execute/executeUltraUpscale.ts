import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';

export async function executeUltraUpscale(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get resource type
	const resource: string = context.getNodeParameter('resource', itemIndex) as string;
	
	// Get parameters
	const inputBinaryField: string = context.getNodeParameter('inputBinaryField', itemIndex, '') as string;
	const imageUrl: string = context.getNodeParameter('image_url', itemIndex, '') as string;
	const upscaleFactor: number = context.getNodeParameter('upscale_factor', itemIndex, 2) as number;
	const imageType: string = context.getNodeParameter('image_type', itemIndex, '') as string;
	const mode: string = context.getNodeParameter('mode', itemIndex, 'sync') as string;
	const format: string = context.getNodeParameter('format', itemIndex, 'JPG') as string;

	// Check if binary data exists (only if resource is DATA)
	let binaryDataBuffer = null;
	let fileName = 'image.png';
	let mimeType = 'image/png';
	
	if (resource === 'DATA') {
		if (!inputBinaryField) {
			throw new NodeOperationError(
				context.getNode(),
				'Input Binary Field is required when using Binary Data resource',
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
		// Validate URL
		if (imageUrl.length < 1 || imageUrl.length > 2083) {
			throw new NodeOperationError(
				context.getNode(),
				'Image URL must be between 1 and 2083 characters',
				{ itemIndex }
			);
		}
	}

	// Prepare form data for ultra upscaling (manual multipart - no form-data package)
	const formFields: Record<string, string | { data: any; filename?: string; contentType?: string }> = {
		upscale_factor: String(upscaleFactor),
		mode: mode,
		format: format,
	};

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

	// Add optional image_type if provided
	if (imageType) {
		formFields.image_type = imageType;
	}

	const multipart = buildMultipartFormData(formFields);
	let result = null;
	let imageBuffer = null;

	try {
		// Call Picsart API to ultra upscale image
		result = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://api.picsart.io/tools/1.0/upscale/ultra',
				headers: {
					Accept: 'application/json',
					'Content-Type': multipart.contentType,
				},
				body: multipart.body,
			},
		);

		// Download the processed image
		imageBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: result?.data?.url,
			encoding: 'arraybuffer',
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}

	// Return processed image data
	returnData.push({
		binary: {
			data: await context.helpers.prepareBinaryData(imageBuffer, 'ultra-upscaled.png'),
		},
		json: {
			imageUrl: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
			upscaleFactor,
			mode,
			result,
		},
	});
}
