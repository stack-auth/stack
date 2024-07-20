import Provider, { Configuration } from 'oidc-provider';

const port = Number.parseInt(process.env.PORT || "8107");

const configuration: Configuration  = {
  clients: [{
    client_id: 'MOCK',
    client_secret: 'MOCK',
    redirect_uris: ['http://localhost:8102/api/v1/auth/oauth/callback/github'],
  }],
};

const oidc = new Provider(`http://localhost:${port}`, configuration);

oidc.listen(port, () => {
  console.log(`oidc-provider listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`);
});
