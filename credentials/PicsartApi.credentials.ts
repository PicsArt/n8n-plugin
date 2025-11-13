import { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class PicsartApi implements ICredentialType {
	name = 'picsartApi';
	displayName = 'Picsart API';
	documentationUrl = 'https://docs.picsart.io/docs/getting-started-with-picsart-api';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
			description: 'API key. You can get it from https://console.picsart.io/dashboard',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-picsart-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.picsart.io',
			url: '/tools/1.0/balance',
			method: 'GET',
			headers: {
				'accept': 'application/json',
			},
		},
	};
}
