import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class PicsartApi implements ICredentialType {
	name = 'picsartApi';
	displayName = 'Picsart API';
	properties = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string' as NodePropertyTypes,
			default: '',
            typeOptions: {
                password: true,
            },
		},
	];
}
