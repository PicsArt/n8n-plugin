import type { IExecuteFunctions, INodeProperties, INodeTypeDescription } from 'n8n-workflow';

export const picsartAuthenticationProperty: INodeProperties = {
	displayName: 'Authentication',
	name: 'authentication',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'API Key', value: 'apiKey' },
		{ name: 'OAuth2 (Beta)', value: 'oAuth2' },
	],
	default: 'apiKey',
	description: 'OAuth2 requires compatible n8n dynamic registration and Picsart service authorization. API Key remains the default.',
};

export const picsartCredentials: INodeTypeDescription['credentials'] = [
	{ name: 'picsartApi', required: true, displayOptions: { show: { authentication: ['apiKey'] } } },
	{ name: 'picsartOAuth2Api', required: true, displayOptions: { show: { authentication: ['oAuth2'] } } },
];

/** Missing selectors in saved workflows must retain their original API-key connection. */
export function picsartCredentialType(context: IExecuteFunctions): string {
	const authentication = context.getNodeParameter('authentication', 0, 'apiKey');
	if (authentication === 'oAuth2') return 'picsartOAuth2Api';
	if (authentication === 'apiKey') return 'picsartApi';
	throw new Error('Unsupported Picsart authentication method');
}
