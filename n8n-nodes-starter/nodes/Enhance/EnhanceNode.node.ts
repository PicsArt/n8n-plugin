import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class EnhanceNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart Enhance',
		name: 'picsartEnhance',
		icon: 'file:../icons/image2vector.svg',
		group: ['transform'],
		version: 1,
		description: 'Node to enhance image with upscale factor',
		defaults: {
			name: 'Picsart Enhance',
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
				displayName: 'Upscale Factor',
				name: 'upscale_factor',
				type: 'options',
				default: '2',
				options: [
					{name: '2x', value: '2'},
					{name: '4x', value: '4'},
					{name: '6x', value: '6'},
					{name: '8x', value: '8'},
				],
				description: 'Upscale factor'
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

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const credentials = await this.getCredentials('picsartApi');
				const imageUrl: string = this.getNodeParameter('image_url', itemIndex) as string;
				const apiKey: string = credentials.apiKey as string;
				const upscaleFactor: string = this.getNodeParameter('upscale_factor', itemIndex) as string;
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
				console.log('Balance', balanceChecker);
				let result = null;

				// Enhance
				const formData: FormData = new FormData();
				formData.append('upscale_factor', upscaleFactor);
				formData.append('format', format);
				formData.append('image_url', imageUrl);

				console.log('image_url', imageUrl);
				console.log('format', format);
				console.log('upscale_factor', upscaleFactor);

				try {
					result = await this.helpers.httpRequest({
						method: 'POST',
						url: 'https://api.picsart.io/tools/1.0/upscale',
						headers: {
							'x-picsart-api-key': apiKey,
							'Accept': 'application/json',
						},
						body: formData,
					});
				} catch (err) {
					console.log(err);
				}

				returnData.push({
					json: {
						imageUrl,
						result,
					}
				});
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
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
