import type { ICredentialType, INodeProperties } from 'n8n-workflow';

/** Optional OAuth uses n8n core discovery, PKCE and token refresh.
 * Live authorization across Picsart service hosts remains a release validation requirement.
 */
export class PicsartOAuth2Api implements ICredentialType {
	name = 'picsartOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Picsart OAuth2 API';

	documentationUrl = 'https://github.com/PicsArt/n8n-plugin#authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'Beta: requires n8n 1.119+ (2.x recommended). Dynamic registration uses scopes advertised by the resource or issuer, not the empty fallback below. The issuer currently advertises drive, profile, credits.balance, openid, storage and workflows.execute. Review consent; service authorization is not yet live-verified.',
			name: 'oauthBetaNotice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Use Dynamic Client Registration',
			name: 'useDynamicClientRegistration',
			type: 'hidden',
			default: true,
		},
		{
			displayName: 'Server URL',
			name: 'serverUrl',
			type: 'hidden',
			default: 'https://auth.picsart.com/api',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'pkce',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://auth.picsart.com/api/oauth2/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://auth.picsart.com/api/oauth2/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'hidden',
			default: '',
		},
	];
}
