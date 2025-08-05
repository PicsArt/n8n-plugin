import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class RemoveBgNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Remove Background',
		name: 'picsartRemoveBackground',
		icon: 'file:../icons/image2vector.svg',
		group: ['transform'],
		version: 1,
		description: 'Node to remove background from image',
		defaults: {
			name: 'Picsart Remove Background',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'picsartApi',
				required: true,
			}
		],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Image URL',
				name: 'image_url',
  				type: 'string',
  				default: '',
  				placeholder: '{{$json["image_url"]}}',
  				description: 'URL image for processing',
			},
			{
				displayName: 'Output Type',
				name: 'output_type',
				type: 'options',
				default: 'cutout',
				noDataExpression: true,
				options: [
					{name: 'cutout', value: 'cutout'},
					{name: 'mask', value: 'mask'}
				],
				description: 'Output type'
			},
			{
				displayName: 'Bg Image URL',
				name: 'bg_image_url',
				type: 'string',
				default: '',
				description: 'Background image url',
			},
			{
				displayName: 'Bg Color',
				name: 'bg_color',
				type: 'string',
				default: '',
				description: 'Background color'
			},
			{
				displayName: 'Bg Blur',
				name: 'bg_blur',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
				description: 'Background blur'
			},
			{
				displayName: 'Bg Width',
				name: 'bg_width',
				type: 'number',
				default: '',
				description: 'Width'
			},
			{
				displayName: 'Bg Height',
				name: 'bg_height',
				type: 'number',
				default: '',
				description: 'Height'
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'options',
				default: 'fit',
				noDataExpression: true,
				options: [
					{name: 'fit', value: 'fit'},
					{name: 'fill', value: 'fill'}
				],
				description: 'Scale',
			},
			{
				displayName: 'Auto Center',
				name: 'auto_center',
				type: 'options',
				default: 'false',
				noDataExpression: true,
				options: [
					{name: 'fasle', value: 'false'},
					{name: 'true', value: 'true'}
				],
				description: 'Auto center'
			},
			{
				displayName: 'Stroke Size',
				name: 'stroke_size',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
				description: 'Stroke size'
			},
			{
				displayName: 'Stroke Color',
				name: 'stroke_color',
				type: 'string',
				default: 'FFFFFF',
				description: 'Stroke color'
			},
			{
				displayName: 'Stroke Opacity',
				name: 'stroke_opacity',
				type: 'number',
				default: 100,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
				description: 'Stroke opacity'
			},
			{
				displayName: 'Shadow',
				name: 'shadow',
				type: 'options',
				default: 'disabled',
				noDataExpression: true,
				options: [
					{name: 'disabled', value: 'disabled'},
					{name: 'custom', value: 'custom'},
					{name: 'bottom-right', value: 'bottom-right'},
					{name: 'bottom', value: 'bottom'},
					{name: 'bottom-left', value: 'bottom-left'},
					{name: 'left', value: 'left'},
					{name: 'right', value: 'right'},
					{name: 'top-left', value: 'top-left'},
					{name: 'top', value: 'top'},
					{name: 'top-right', value: 'top-right'},
				],
				description: 'Shadow'
			},
			{
				displayName: 'Shadow Opacity',
				name: 'shadow_opacity',
				type: 'number',
				default: 20,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
				description: 'Shadow opacity'
			},
			{
				displayName: 'Shadow Blur',
				name: 'shadow_blur',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
				description: 'Shadow blur'
			},
			{
				displayName: 'Shadow Offset X',
				name: 'shadow_offset_x',
				type: 'number',
				default: '',
				typeOptions: {
					minValue: -100,
					maxValue: 100,
				},
				description: 'Shadow offset x'
			},
			{
				displayName: 'Shadow Offset y',
				name: 'shadow_offset_y',
				type: 'number',
				default: '',
				typeOptions: {
					minValue: -100,
					maxValue: 100,
				},
				description: 'Shadow offset y'
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				default: 'PNG',
				noDataExpression: true,
				options: [
					{name: 'JPG', value: 'JPG'},
					{name: 'PNG', value: 'PNG'},
					{name: 'WEBP', value: 'WEBP'}
				],
				description: 'Format'
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items: INodeExecutionData[] = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// default part
				const credentials = await this.getCredentials('picsartApi');
				const apiKey: string = credentials.apiKey as string;
				const imageUrl: string = this.getNodeParameter('image_url', itemIndex) as string;
				const outputType: string = this.getNodeParameter('output_type', itemIndex) as string;
				const bgBlur: string = this.getNodeParameter('bg_blur', itemIndex) as string;
				const scale: string = this.getNodeParameter('scale', itemIndex) as string;
				const autoCenter: string = this.getNodeParameter('auto_center', itemIndex) as string;
				const strokeSize: string = this.getNodeParameter('stroke_size', itemIndex) as string;
				const strokeColor: string = this.getNodeParameter('stroke_color', itemIndex) as string;
				const strokeOpacity: string = this.getNodeParameter('stroke_opacity', itemIndex) as string;
				const shadow: string = this.getNodeParameter('shadow', itemIndex) as string;
				const shadowOpacity: string = this.getNodeParameter('shadow_opacity', itemIndex) as string;
				const shadowBlur: string = this.getNodeParameter('shadow_blur', itemIndex) as string;
    			const format: string = this.getNodeParameter('format', itemIndex) as string;
    			

				if (!apiKey) {
					throw new Error('invalid token');
				}
				let balanceChecker = null;
				try {
					balanceChecker = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://api.picsart.io/tools/1.0/balance',
						headers: {
							'x-picsart-api-key': apiKey,
							'accept': 'application/json'
						}
					});
				} catch (err) {
					throw new Error('invalid token');
				}
				console.log('balanceChecker', balanceChecker);
				// throw new Error('balance nemma');

				let result = null;
				
				// Remove background
				const formData: FormData = new FormData();
				formData.append('image_url', imageUrl);
    			formData.append('output_type', outputType);
    			formData.append('bg_blur', bgBlur);
    			formData.append('scale', scale);
    			formData.append('auto_center', autoCenter);
    			formData.append('stroke_size', strokeSize);
    			formData.append('stroke_color', strokeColor);
    			formData.append('stroke_opacity', strokeOpacity);
    			formData.append('shadow', shadow);
    			formData.append('shadow_opacity', shadowOpacity);
    			formData.append('shadow_blur', shadowBlur);
    			formData.append('format', format);
				let imageBuffer = null;
				try {
					result = await this.helpers.httpRequest({
						method: 'POST',
						url: 'https://api.picsart.io/tools/1.0/removebg',
						headers: {
							'x-picsart-api-key': apiKey,
							'Accept': 'application/json',
						},
						body: formData,
					});
					imageBuffer = await this.helpers.request({
						method: 'GET',
						url: result?.data?.url,
						encoding: null,
					});
				} catch (err) {
					console.log(err);
				}
				
				returnData.push({
					binary: {
						data: await this.helpers.prepareBinaryData(imageBuffer, 'result.png'),
					},
					json: {
						imageUrl,
						result,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: items[itemIndex].json, error, pairedItem: itemIndex });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}
	
		return [returnData];
	}	
}
