import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import Provider from 'oidc-provider';

interface ProviderSettings {
  redirectUris: string[],
  clientId: string,
  clientSecret: string,
}

function getProvider(providerSettings: ProviderSettings) {


  const provider = new Provider(getEnvVariable('STACK_BASE_URL'), {
    clients: [
      {
        client_id: providerSettings.clientId,
        client_secret: providerSettings.clientSecret,
        redirect_uris: providerSettings.redirectUris,
      },
    ],
  });


  return provider;
}

const idp = getProvider({
  redirectUris: ['http://localhost:8102/api/v1/auth/oauth/callback/github'],
  clientId: 'github',
  clientSecret: 'MOCK-SERVER-SECRET',
});

