import Provider, { Configuration } from "oidc-provider";

const port = Number.parseInt(process.env.PORT || "8107");

const mockedProviders = ["github", "facebook", "google", "microsoft", "spotify", "discord", "gitlab"];

const configuration: Configuration = {
  clients: mockedProviders.map((providerId) => ({
    client_id: providerId,
    client_secret: "MOCK-SERVER-SECRET",
    redirect_uris: [`http://localhost:8102/api/v1/auth/oauth/callback/${providerId}`],
  })),
  ttl: {
    // we make sessions short so it asks us for our login again after a minute, instead of automatically logging us in with the already-logged-in session
    Session: 60,
  },
};

const oidc = new Provider(`http://localhost:${port}`, configuration);

oidc.listen(port, () => {
  console.log(`oidc-provider listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`);
});
