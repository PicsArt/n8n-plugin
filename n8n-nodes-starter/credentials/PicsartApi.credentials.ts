import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class PicsartApi implements ICredentialType {
	name = 'picsartApi';
	displayName = 'Picsart API';
	documentationUrl = 'https://docs.picsart.io/reference/image-upscale'; // 👈 Add a valid docs link

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
            typeOptions: {
                password: true,
            },
		},
	];
}
