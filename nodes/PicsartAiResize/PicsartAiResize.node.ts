import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import registry from './registry.json';
import { https, size, catalogOptions, pngDimensions } from './helpers';
const task = 'api-bu/images/image-to-image',
	base = 'https://api.picsart.com/gw-v2/workflows/';
const headers = { platform: 'api', 'X-Touchpoint': 'sdk' };
const generating = {
	show: { operation: ['resize_image_with_ai', 'create_ai_image_size_variants'] },
};
const properties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'resize_image_with_ai',
		options: [
			{
				name: 'Resize with AI',
				value: 'resize_image_with_ai',
				action: 'Resize with AI',
				description:
					'Submit one AI image edit for a selected size. Retrieve the saved task to measure its actual output.',
			},
			{
				name: 'Create Image Size Variants with AI',
				value: 'create_ai_image_size_variants',
				action: 'Create image size variants with AI',
				description:
					'Submit one independently reviewable image edit per selected size. Save every returned task ID.',
			},
			{
				name: 'Get AI Resize Result',
				value: 'get_ai_resize_result',
				action: 'Get an AI resize result',
				description:
					'Retrieve an existing resize task and compare PNG dimensions with the requested size. Does not generate another image.',
			},
		],
	},
	{
		displayName: 'Source Image URL',
		name: 'source_image',
		type: 'string',
		default: '',
		required: true,
		displayOptions: generating,
		description: 'Accessible HTTPS image URL, not a storage share page',
	},
	{
		displayName: 'Model Name or ID',
		name: 'model',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getResizeModels' },
		default: '',
		required: true,
		displayOptions: generating,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Target Size',
		name: 'target_size',
		type: 'options',
		options: [
			...registry.presets.map((p) => ({ name: p.label, value: p.id })),
			{ name: 'Custom', value: 'custom' },
		],
		default: 'custom',
		required: true,
		displayOptions: { show: { operation: ['resize_image_with_ai'] } },
		description:
			'300 × 50 is listed for scope visibility but rejected: the backend minimum height is 64',
	},
	{
		displayName: 'Target Sizes',
		name: 'target_sizes',
		type: 'multiOptions',
		options: registry.presets.map((p) => ({ name: p.label, value: p.id })),
		default: [],
		required: true,
		displayOptions: { show: { operation: ['create_ai_image_size_variants'] } },
		description:
			'Explicitly select sizes. Each size submits one paid job; no sizes are selected automatically.',
	},
	...(['width', 'height'] as const).map((key) => ({
		displayName: key === 'width' ? 'Custom Width' : 'Custom Height',
		name: key,
		type: 'number' as const,
		default: 0,
		typeOptions: { minValue: 64, maxValue: 4096 },
		displayOptions: { show: { operation: ['resize_image_with_ai'], target_size: ['custom'] } },
	})),
	{
		displayName: 'Edit Instructions',
		name: 'instructions',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		displayOptions: generating,
		description:
			'Optional composition changes; the base prompt preserves the source subject and intended message',
	},
	{
		displayName: 'Task ID',
		name: 'task_id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { operation: ['get_ai_resize_result'] } },
		description:
			'Map the exact accepted task ID. Retrieve pending tasks again; never resubmit them.',
	},
	...(['requested_width', 'requested_height'] as const).map((key) => ({
		displayName: key === 'requested_width' ? 'Requested Width' : 'Requested Height',
		name: key,
		type: 'number' as const,
		default: 0,
		required: true,
		displayOptions: { show: { operation: ['get_ai_resize_result'] } },
	})),
];
export class PicsartAiResize implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Picsart AI Resize',
		name: 'picsartAiResize',
		icon: 'file:../icons/picsart.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{ $parameter["operation"] }}',
		description:
			'Recompose a source image for selected sizes with AI and verify returned image dimensions. Exact dimensions and visual fidelity require result review.',
		defaults: { name: 'Picsart AI Resize' },
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		credentials: [{ name: 'picsartOAuth2Api', required: true }],
		properties,
	};
	methods = {
		loadOptions: {
			async getResizeModels(this: ILoadOptionsFunctions) {
				return catalogOptions(
					await this.helpers.httpRequestWithAuthentication.call(this, 'picsartOAuth2Api', {
						method: 'POST',
						url: base + 'api-bu/models/list/execute',
						headers,
						body: { params: { task } },
						json: true,
						timeout: 30000,
					}),
				);
			},
		},
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const output: INodeExecutionData[] = [];
		for (let i = 0; i < this.getInputData().length; i++) {
			const accepted: IDataObject[] = [];
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				if (operation === 'get_ai_resize_result') {
					const id = this.getNodeParameter('task_id', i) as string;
					if (typeof id !== 'string' || !id.trim() || id !== id.trim() || id.length > 512)
						throw Error('Use the exact accepted task ID');
					const requested = size(
						this.getNodeParameter('requested_width', i),
						this.getNodeParameter('requested_height', i),
					);
					accepted.push({
						task_id: id,
						requested_width: requested.width,
						requested_height: requested.height,
					});
					const body = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'picsartOAuth2Api',
						{
							method: 'GET',
							url: base + task + '/' + encodeURIComponent(id) + '/result',
							headers,
							json: true,
							timeout: 30000,
						},
					);
					const result = body?.response;
					if (body?.status !== 'success' || !result)
						throw Error('Result retrieval failed; do not resubmit');
					if (result.id !== id)
						throw Error('Result task ID does not match the saved task; do not use this result');
					if (['ACCEPTED', 'IN_PROGRESS'].includes(result.status)) {
						output.push({
							json: {
								task_id: id,
								status: result.status,
								completed: false,
								requested_width: requested.width,
								requested_height: requested.height,
							},
							pairedItem: { item: i },
						});
						continue;
					}
					if (
						result.status !== 'COMPLETED' ||
						!Array.isArray(result.result?.data) ||
						result.result.data.length !== 1
					)
						throw Error(
							'Task is failed, unknown, or returned an unexpected image count; inspect before any resubmission',
						);
					const image = result.result.data[0];
					if (image.status !== undefined && image.status !== 'success')
						throw Error('Task returned an unsuccessful image');
					const url = https(image.url);
					const bytes = await this.helpers.httpRequest({
						method: 'GET',
						url,
						encoding: 'arraybuffer',
						disableFollowRedirect: true,
						timeout: 30000,
					});
					const actual = pngDimensions(Buffer.from(bytes));
					output.push({
						json: {
							task_id: id,
							status: 'COMPLETED',
							completed: true,
							image_url: url,
							mime_type: 'image/png',
							requested_width: requested.width,
							requested_height: requested.height,
							actual_width: actual.width,
							actual_height: actual.height,
							size_match: actual.width === requested.width && actual.height === requested.height,
							dimension_measurement: 'PNG IHDR',
							review_required: true,
							visual_fidelity_verified: false,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				if (!['resize_image_with_ai', 'create_ai_image_size_variants'].includes(operation))
					throw Error('Unsupported AI resize operation');
				const source = https(this.getNodeParameter('source_image', i));
				const model = this.getNodeParameter('model', i) as string;
				if (!registry.models.includes(model))
					throw Error(
						'Model needs a verified image-edit parameter contract; no alias substitution',
					);
				const selected =
					operation === 'resize_image_with_ai'
						? [this.getNodeParameter('target_size', i)]
						: this.getNodeParameter('target_sizes', i);
				if (
					!Array.isArray(selected) ||
					!selected.length ||
					new Set(selected).size !== selected.length
				)
					throw Error('Explicitly select each target size once');
				const targets = selected.map((key) => {
					if (key === 'custom' && operation === 'resize_image_with_ai')
						return size(this.getNodeParameter('width', i), this.getNodeParameter('height', i));
					const p = registry.presets.find((p) => p.id === key);
					if (!p) throw Error('Unknown target size');
					return size(p.width, p.height);
				});
				const instructions = this.getNodeParameter('instructions', i, '');
				if (typeof instructions !== 'string') throw Error('Instructions must be text');
				const requests = targets.map((t) => {
					const prompt = registry.prompt
						.replace('{width}', String(t.width))
						.replace('{height}', String(t.height))
						.replace('{optional_edit_instructions}', () => instructions)
						.trim();
					if (prompt.length > 10000) throw Error('Completed prompt exceeds 10000 characters');
					return { params: { image_url: source, prompt, model, ...t, count: 1, format: 'png' } };
				});
				for (let k = 0; k < requests.length; k++) {
					let response;
					try {
						response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'picsartOAuth2Api',
							{
								method: 'POST',
								url: base + task + '/submit',
								headers,
								body: requests[k],
								json: true,
								timeout: 60000,
							},
						);
					} catch {
						throw Error(
							'Submission outcome unknown for ' +
								targets[k].width +
								'x' +
								targets[k].height +
								'. Do not resubmit automatically.',
						);
					}
					const id = response?.response?.id;
					if (
						response?.status !== 'success' ||
						typeof id !== 'string' ||
						!id.trim() ||
						id !== id.trim() ||
						id.length > 512
					)
						throw Error('No valid accepted task ID; do not retry automatically.');
					accepted.push({
						task_id: id,
						status: 'SUBMITTED',
						completed: false,
						model,
						requested_width: targets[k].width,
						requested_height: targets[k].height,
						review_required: true,
					});
				}
				for (const receipt of accepted) output.push({ json: receipt, pairedItem: { item: i } });
			} catch (error) {
				const message =
					(error as Error).message +
					(accepted.length ? ' Saved accepted tasks: ' + JSON.stringify(accepted) : '');
				if (this.continueOnFail()) {
					output.push({
						json: {
							error: message,
							accepted_tasks: accepted,
							completed: false,
							automatic_resubmission_allowed: false,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), message, { itemIndex: i });
			}
		}
		return [output];
	}
}
