import { captureError } from '@stackframe/stack-shared/dist/utils/errors';
import Provider from 'oidc-provider';


import QuickLRU from 'quick-lru';

interface StorageValue {
  consumed?: number,
  uid: string,
  grantId?: string,
  userCode?: string,
  [key: string]: any, // Add index signature to allow arbitrary string keys
}

let storage = new QuickLRU<string, StorageValue | string[] | string>({ maxSize: 1000 });

function grantKeyFor(id: string): string {
  return `grant:${id}`;
}

function sessionUidKeyFor(id: string): string {
  return `sessionUid:${id}`;
}

function userCodeKeyFor(userCode: string): string {
  return `userCode:${userCode}`;
}

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

class MemoryAdapter {
  private model: string;

  constructor(model: string) {
    this.model = model;
  }

  key(id: string): string {
    return `${this.model}:${id}`;
  }

  async destroy(id: string): Promise<void> {
    console.log('MemoryAdapter destroy', this.model, id);
    const key = this.key(id);
    storage.delete(key);
  }

  async consume(id: string): Promise<void> {
    console.log('MemoryAdapter consume', this.model, id);
    const value = storage.get(this.key(id)) as StorageValue;
    value.consumed = Math.floor(Date.now() / 1000);
  }

  async find(id: string): Promise<StorageValue | undefined> {
    console.log('MemoryAdapter find', this.model, id);
    return storage.get(this.key(id)) as StorageValue | undefined;
  }

  async findByUid(uid: string): Promise<StorageValue | undefined> {
    console.log('MemoryAdapter findByUid', this.model, uid);
    const id = storage.get(sessionUidKeyFor(uid)) as string;
    return await this.find(id);
  }

  async findByUserCode(userCode: string): Promise<StorageValue | undefined> {
    console.log('MemoryAdapter findByUserCode', this.model, userCode);
    const id = storage.get(userCodeKeyFor(userCode)) as string;
    return await this.find(id);
  }

  async upsert(id: string, payload: StorageValue, expiresIn: number): Promise<void> {
    const key = this.key(id);
    console.log('MemoryAdapter upsert', this.model, id, payload, expiresIn);
    if (this.model === 'Session') {
      storage.set(sessionUidKeyFor(payload.uid), id, { maxAge: expiresIn * 1000 });
    }

    const { grantId, userCode } = payload;
    if (grantable.has(this.model) && grantId) {
      const grantKey = grantKeyFor(grantId);
      const grant = storage.get(grantKey) as string[] | undefined;
      if (!grant) {
        storage.set(grantKey, [key]);
      } else {
        grant.push(key);
      }
    }

    if (userCode) {
      storage.set(userCodeKeyFor(userCode), id, { maxAge: expiresIn * 1000 });
    }

    storage.set(key, payload, { maxAge: expiresIn * 1000 });
  }


  async revokeByGrantId(grantId: string): Promise<void> {
    const grantKey = grantKeyFor(grantId);
    const grant = storage.get(grantKey) as string[] | undefined;
    if (grant) {
      grant.forEach((token: string) => storage.delete(token));
      storage.delete(grantKey);
    }
  }
}

const mockedProviders = [
  "stack-auth",
];

// TODO: add stateful session management


export function createOidcProvider(baseUrl: string) {
  const oidc = new Provider(baseUrl, {
    adapter: MemoryAdapter,
    clients: mockedProviders.map((providerId) => ({
      client_id: "client-id",
      client_secret: "test-client-secret",
      redirect_uris: [
        `http://localhost:8116/api/auth/callback/stack-auth`,
      ],
    })),
    ttl: {
      // we make sessions short so it asks us for our login again after a minute, instead of automatically logging us in with the already-logged-in session
      Session: 60,
    },
    features: {
      devInteractions: {
        enabled: false,
      },
    },

    async loadExistingGrant(ctx: any) {
      const grantId = ctx.oidc.result?.consent?.grantId
        || ctx.oidc.session!.grantIdFor(ctx.oidc.client!.clientId);

      if (grantId) {
        // keep grant expiry aligned with session expiry
        // to prevent consent prompt being requested when grant expires
        const grant = await ctx.oidc.provider.Grant.find(grantId);

        // this aligns the Grant ttl with that of the current session
        // if the same Grant is used for multiple sessions, or is set
        // to never expire, you probably do not want this in your code
        if (ctx.oidc.account && grant.exp < ctx.oidc.session!.exp) {
          grant.exp = ctx.oidc.session!.exp;

          await grant.save();
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (true /*HACK*/) {
          console.warn("hack iftrue");
          const grant = new ctx.oidc.provider.Grant({
            clientId: ctx.oidc.client!.clientId,
            accountId: ctx.oidc.session!.accountId,
          });

        grant.addOIDCScope('openid email profile');
        grant.addOIDCClaims(['first_name']);
        grant.addResourceScope('urn:example:resource-indicator', 'api:read api:write');
        await grant.save();
        return grant;
        }
      }
    },

    interactions: {
      // THIS IS WHERE WE REDIRECT TO PRIMARY AUTH SERVER
      // TODO: do we need to sanitize the parameter?
      url: (ctx, interaction) => `${baseUrl}/interaction/${encodeURIComponent(interaction.uid)}`,

    },


    async findAccount(ctx, id) {
      return {
        accountId: id,
        claims: async (use, scope, claims, rejected) => {
          return {
            sub: id,
            email: "test@example.com",
            email_verified: true,
            name: "Test User"
          };
        }
      };
    },
  });

  oidc.on('server_error', (ctx, err) => {
    captureError('idp-oidc-provider-server-error', err);
  });

  oidc.use(async (ctx, next) => {
    try {
      if (/^\/interaction\/[^/]+\/login$/.test(ctx.path)) {
        switch (ctx.method) {
          case 'GET': {
            ctx.status = 200;
            ctx.body = `
              <html>
                <body>
                  <noscript>
                    Note: JavaScript is disabled, so you must click the button below to continue.
                  </noscript>
                  <form id="continue-form" method="POST">
                    <input type="submit" value="Continue">
                  </form>
                  <script>
                    document.getElementById('continue-form').style.display = 'none';
                    document.getElementById('continue-form').submit();
                    setTimeout(() => {
                      document.getElementById('continue-form').style.display = 'block';
                    }, 5000);
                  </script>
                </body>
              </html>
            `;
            break;
          }
          case 'POST': {
            console.log("OOOOO 1");
            const uid = ctx.path.split('/')[2];


            const grant = new oidc.Grant({
              accountId: "lmao_id",
              clientId: "client-id",
            });
            console.log("OOOOO 2");

            const grantId = await grant.save();
            console.log("OOOOO 3");


            const result = {
              login: {
                accountId: "lmao_id",
              },
              consent: {
                grantId,
              },
            };
            console.log("OOOOO 4");

            console.log("RESSS", await oidc.interactionResult(ctx.req, ctx.res, result));
            console.log("OOOOO 5");

            return await oidc.interactionFinished(ctx.req, ctx.res, result);
          }
        }
      }
      if (ctx.method === 'GET' && /^\/interaction\/[^/]+$/.test(ctx.path)) {
        const uid = ctx.path.split('/')[2];
        return ctx.redirect(`http://localhost:8103/handler/sign-in?after_auth_return_to=${encodeURIComponent(`${baseUrl}/interaction/${encodeURIComponent(uid)}/login`)}`);
      }
    } catch (err) {
      captureError('idp-oidc-interaction-middleware', err);
      throw err;
    }
    await next();
  });

  return oidc;
}

