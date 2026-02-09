import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMultipartFormData } from './utils';
import { handleApiError } from './errorHandler';

export async function executeEditImage(
	context: IExecuteFunctions,
	itemIndex: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	// Get resource type
	const resource: string = context.getNodeParameter('resource', itemIndex) as string;
	
	// Get parameters
	const inputBinaryField: string = context.getNodeParameter('inputBinaryField', itemIndex, '') as string;
	const imageUrl: string = context.getNodeParameter('image_url', itemIndex, '') as string;
	const format: string = context.getNodeParameter('format', itemIndex, 'JPG') as string;
	const mode: string = context.getNodeParameter('mode', itemIndex, '') as string;
	const size: number = context.getNodeParameter('size', itemIndex, 0) as number;
	const width: number = context.getNodeParameter('width', itemIndex, 0) as number;
	const height: number = context.getNodeParameter('height', itemIndex, 0) as number;
	const crop_x: number = context.getNodeParameter('crop_x', itemIndex, 0) as number;
	const crop_y: number = context.getNodeParameter('crop_y', itemIndex, 0) as number;
	const crop_anchor: string = context.getNodeParameter('crop_anchor', itemIndex, 'center') as string;
	const flip: string = context.getNodeParameter('flip', itemIndex, '') as string;
	const rotate: number = context.getNodeParameter('rotate', itemIndex, 0) as number;
	const perspective_horizontal: number = context.getNodeParameter('perspective_horizontal', itemIndex, 0) as number;
	const perspective_vertical: number = context.getNodeParameter('perspective_vertical', itemIndex, 0) as number;
	const quality: number = context.getNodeParameter('quality', itemIndex, 90) as number;

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

	// Prepare form data for image editing
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

	// Add format
	formFields.format = format;

	// Add optional parameters only if they are set
	if (mode) {
		formFields.mode = mode;
	}

	if (size > 0) {
		formFields.size = size.toString();
	}

	if (width > 0) {
		formFields.width = width.toString();
	}

	if (height > 0) {
		formFields.height = height.toString();
	}

	if (crop_x > 0) {
		formFields.crop_x = crop_x.toString();
	}

	if (crop_y > 0) {
		formFields.crop_y = crop_y.toString();
	}

	formFields.crop_anchor = crop_anchor;

	if (flip) {
		formFields.flip = flip;
	}

	formFields.rotate = rotate.toString();
	formFields.perspective_horizontal = perspective_horizontal.toString();
	formFields.perspective_vertical = perspective_vertical.toString();
	formFields.quality = quality.toString();

	const multipart = buildMultipartFormData(formFields);
	let result = null;
	let imageBuffer = null;
	
	try {
		// Call Picsart API to edit image
		result = await context.helpers.httpRequestWithAuthentication.call(
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

		// Download the edited image
		imageBuffer = await context.helpers.httpRequest({
			method: 'GET',
			url: result?.data?.url,
			encoding: 'arraybuffer',
		});
	} catch (error: any) {
		handleApiError(context, error, itemIndex);
	}

	// Return edited image data
	returnData.push({
		binary: {
			data: await context.helpers.prepareBinaryData(imageBuffer, `edited-image.${format.toLowerCase()}`),
		},
		json: {
			imageSource: binaryDataBuffer ? `[Binary: ${fileName}]` : imageUrl,
			format,
			mode,
			size,
			width,
			height,
			crop_anchor,
			flip,
			rotate,
			perspective_horizontal,
			perspective_vertical,
			quality,
			result,
		},
	});
}
