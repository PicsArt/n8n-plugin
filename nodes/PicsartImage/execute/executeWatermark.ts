import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';

export async function executeWatermark(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get resource type
	const resource: string = context.getNodeParameter('resource', itemIndex) as string;
	
	// Get parameters
	const inputBinaryField: string = context.getNodeParameter('inputBinaryField', itemIndex, '') as string;
	const imageUrl: string = context.getNodeParameter('image_url', itemIndex, '') as string;
	const watermarkSource: string = context.getNodeParameter('watermarkSource', itemIndex, 'url') as string;
	const watermarkBinaryField: string = context.getNodeParameter('watermarkBinaryField', itemIndex, '') as string;
	const watermarkUrl: string = context.getNodeParameter('watermark_url', itemIndex, '') as string;
	const anchorPoint: string = context.getNodeParameter('anchor_point', itemIndex, 'center-middle') as string;
	const watermarkWidth: number = context.getNodeParameter('watermark_width', itemIndex, 0) as number;
	const watermarkHeight: number = context.getNodeParameter('watermark_height', itemIndex, 0) as number;
	const watermarkOpacity: number = context.getNodeParameter('watermark_opacity', itemIndex, 50) as number;
	const watermarkAngle: number = context.getNodeParameter('watermark_angle', itemIndex, 0) as number;
	const watermarkPaddingX: number = context.getNodeParameter('watermark_padding_x', itemIndex, 0) as number;
	const watermarkPaddingY: number = context.getNodeParameter('watermark_padding_y', itemIndex, 0) as number;
	const format: string = context.getNodeParameter('format', itemIndex, 'JPG') as string;

	// Check if binary data exists for source image (only if resource is DATA)
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

	// Check watermark source
	let watermarkBuffer = null;
	let watermarkFileName = 'watermark.png';
	let watermarkMimeType = 'image/png';

	if (watermarkSource === 'binary') {
		if (!watermarkBinaryField) {
			throw new NodeOperationError(
				context.getNode(),
				'Watermark Binary Field is required when using Binary watermark source',
				{ itemIndex }
			);
		}
		try {
			const watermarkData = context.helpers.assertBinaryData(itemIndex, watermarkBinaryField);
			watermarkBuffer = await context.helpers.getBinaryDataBuffer(itemIndex, watermarkBinaryField);
			watermarkFileName = watermarkData.fileName || (watermarkData.fileExtension ? `watermark.${watermarkData.fileExtension}` : 'watermark.png');
			watermarkMimeType = watermarkData.mimeType || 'image/png';
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Watermark binary data not found in field "${watermarkBinaryField}". Please ensure the watermark image is provided.`,
				{ itemIndex }
			);
		}
	} else if (watermarkSource === 'url') {
		if (!watermarkUrl) {
			throw new NodeOperationError(
				context.getNode(),
				'Watermark URL is required when using URL watermark source',
				{ itemIndex }
			);
		}
	}

	// Prepare form data for watermarking
	const formFields: Record<string, string | { data: any; filename?: string; contentType?: string }> = {};

	// Add source image
	if (binaryDataBuffer) {
		formFields.image = {
			data: binaryDataBuffer,
			filename: fileName,
			contentType: mimeType,
		};
	} else {
		formFields.image_url = imageUrl;
	}

	// Add watermark
	if (watermarkBuffer) {
		formFields.watermark = {
			data: watermarkBuffer,
			filename: watermarkFileName,
			contentType: watermarkMimeType,
		};
	} else {
		formFields.watermark_url = watermarkUrl;
	}

	// Add other parameters
	formFields.anchor_point = anchorPoint;
	formFields.format = format;

	if (watermarkWidth > 0) {
		formFields.watermark_width = watermarkWidth.toString();
	}

	if (watermarkHeight > 0) {
		formFields.watermark_height = watermarkHeight.toString();
	}

	formFields.watermark_opacity = watermarkOpacity.toString();

	if (watermarkAngle > 0) {
		formFields.watermark_angle = watermarkAngle.toString();
	}

	formFields.watermark_padding_x = watermarkPaddingX.toString();
	formFields.watermark_padding_y = watermarkPaddingY.toString();

	const multipart = buildMultipartFormData(formFields);
	let result = null;
	let imageBuffer = null;
	
	try {
		// Call Picsart API to add watermark
		result = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'picsartApi',
			{
				method: 'POST',
				url: 'https://api.picsart.io/tools/1.0/watermark',
				headers: {
					Accept: 'application/json',
					'Content-Type': multipart.contentType,
				},
				body: multipart.body,
			},
		);

		// Download the watermarked image
		imageBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: result?.data?.url,
			encoding: 'arraybuffer',
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}

	// Return watermarked image data
	returnData.push({
		binary: {
			data: await context.helpers.prepareBinaryData(imageBuffer, `watermarked-image.${format.toLowerCase()}`),
		},
		json: {
			imageSource: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
			watermarkSource: watermarkBuffer ? `[Binary: ${watermarkFileName}]` : watermarkUrl,
			anchorPoint,
			watermarkWidth,
			watermarkHeight,
			watermarkOpacity,
			watermarkAngle,
			watermarkPaddingX,
			watermarkPaddingY,
			format,
			result,
		},
	});
}
