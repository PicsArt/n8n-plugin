import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';

export async function executeEnhance(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get resource type
	const resource: string = context.getNodeParameter('resource', itemIndex) as string;
	
	// Get parameters
	const inputBinaryField: string = context.getNodeParameter('inputBinaryField', itemIndex, '') as string;
	const imageUrl: string = context.getNodeParameter('image_url', itemIndex, '') as string;
	const upscaleFactor: string = context.getNodeParameter('upscale_factor', itemIndex) as string;
	const format: string = context.getNodeParameter('format', itemIndex) as string;

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

	// If using URL, validate it
	if (!binaryDataBuffer && imageUrl) {
		if (!imageUrl || imageUrl.length < 1 || imageUrl.length > 2083) {
			throw new NodeOperationError(
				context.getNode(),
				'image_url is required and must be 1..2083 chars',
				{ itemIndex },
			);
		}

		try {
			// Basic URI validation
			// eslint-disable-next-line no-new
			new URL(imageUrl);
		} catch (_) {
			throw new NodeOperationError(context.getNode(), 'image_url must be a valid URL', {
				itemIndex,
			});
		}
	}

	// format validation (default JPG; allowed: JPG, PNG, WEBP)
	const allowedFormats = ['JPG', 'PNG', 'WEBP'];
	const normalizedFormat = (format || 'JPG').toUpperCase();

	if (!allowedFormats.includes(normalizedFormat)) {
		throw new NodeOperationError(context.getNode(), 'format must be one of: JPG, PNG, WEBP', {
			itemIndex,
		});
	}

	// image_url extension validation (only if using URL)
	if (!binaryDataBuffer && imageUrl) {
		try {
			const urlObj = new URL(imageUrl);
			const pathname = urlObj.pathname || '';
			const extRaw = pathname.split('.').pop() || '';
			const ext = extRaw.toLowerCase();
			const extMap: Record<string, 'JPG' | 'PNG' | 'WEBP'> = {
				jpg: 'JPG',
				jpeg: 'JPG',
				png: 'PNG',
				webp: 'WEBP',
			};
			if (ext && !Object.keys(extMap).includes(ext)) {
				throw new NodeOperationError(
					context.getNode(),
					'image_url must point to JPG, PNG, or WEBP',
					{ itemIndex },
				);
			}
			const urlFormat = ext ? extMap[ext] : undefined;
			if (urlFormat && urlFormat !== normalizedFormat) {
				throw new NodeOperationError(
					context.getNode(),
					`format (${normalizedFormat}) must match image_url extension (${urlFormat})`,
					{ itemIndex },
				);
			}
		} catch (_) {
			// URL already validated above; ignore parse edge cases here
			throw new NodeOperationError(
				context.getNode(),
				'image_url must point to JPG, PNG, or WEBP',
				{ itemIndex },
			);
		}
	}

	let result = null;
	let imageBuffer = null;

	// Prepare form data for upscaling (manual multipart - no form-data package)
	const formFields: Record<string, string | { data: any; filename?: string; contentType?: string }> = {
		upscale_factor: upscaleFactor,
		format: normalizedFormat,
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

	const multipart = buildMultipartFormData(formFields);
	try {
		// Call Picsart API to enhance/upscale image
		result = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://api.picsart.io/tools/1.0/upscale',
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
			data: await context.helpers.prepareBinaryData(imageBuffer, 'result.png'),
		},
		json: {
			imageUrl: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
			result,
		},
	});
}
