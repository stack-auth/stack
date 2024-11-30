import { StackAssertionError, captureError, throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import Provider, { Adapter, AdapterConstructor, AdapterPayload } from 'oidc-provider';


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

type AdapterData = {
  payload: AdapterPayload,
  expiresAt: Date,
};

function createAdapter(options: {
  onUpdateUnique: (
    model: string,
    idOrWhere: string | { propertyKey: keyof AdapterPayload, propertyValue: string },
    updater: (old: AdapterData | undefined) => AdapterData | undefined
  ) => void | Promise<void>,
}): AdapterConstructor {
  const niceUpdate = async (
    model: string,
    idOrWhere: string | { propertyKey: keyof AdapterPayload, propertyValue: string },
    updater?: (old: AdapterData | undefined) => AdapterData | undefined,
  ): Promise<AdapterPayload | undefined> => {
    let wasCalled = false as boolean;
    let updated: AdapterData | undefined;
    await options.onUpdateUnique(
      model,
      idOrWhere,
      (old) => {
        if (wasCalled) throw new StackAssertionError('Adapter update called more than once');
        wasCalled = true;
        updated = (updater ? updater(old) : old);
        return updated;
      },
    );
    if (!wasCalled) throw new StackAssertionError('Adapter update was not called');
    return updated?.payload;
  };

  return class CustomAdapter implements Adapter {
    private model: string;

    constructor(model: string) {
      this.model = model;
    }

    async upsert(id: string, payload: AdapterPayload, expiresInSeconds: number): Promise<void> {
      await niceUpdate(this.model, id, () => ({ payload, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) }));
    }

    async find(id: string): Promise<AdapterPayload | undefined> {
      return await niceUpdate(this.model, id);
    }

    async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
      return await niceUpdate(this.model, { propertyKey: 'userCode', propertyValue: userCode });
    }

    async findByUid(uid: string): Promise<AdapterPayload | undefined> {
      return await niceUpdate(this.model, { propertyKey: 'uid', propertyValue: uid });
    }

    async consume(id: string): Promise<void> {
      await niceUpdate(this.model, id, (old) => old ? { ...old, payload: { ...old.payload, consumed: true } } : undefined);
    }

    async destroy(id: string): Promise<void> {
      await niceUpdate(this.model, id, () => undefined);
    }

    async revokeByGrantId(grantId: string): Promise<void> {
      await niceUpdate(this.model, { propertyKey: 'grantId', propertyValue: grantId }, () => undefined);
    }
  };
}

const memoryAdapterStorage = new Map<string, Map<string, AdapterData>>();
const MemoryAdapter = createAdapter({
  onUpdateUnique(model: string, idOrWhere: string | { propertyKey: keyof AdapterPayload, propertyValue: string }, updater: (old: AdapterData | undefined) => AdapterData | undefined) {
    let map = memoryAdapterStorage.get(model);
    if (!map) {
        memoryAdapterStorage.set(model, map = new Map());
    }

    let id: string;
    if (typeof idOrWhere === 'string') {
      id = idOrWhere;
    } else {
      const { propertyKey, propertyValue } = idOrWhere;
      id = [...map].find(([_, data]) => data.payload[propertyKey] === propertyValue)?.[0] ?? throwErr(`No ${model} found with ${propertyKey} = ${propertyValue}`);
    }

    let old = map.get(id);
    if (old?.expiresAt && old.expiresAt < new Date()) {
      old = undefined;
    }
    console.log("onUpdateUnique", model, idOrWhere, old, map);

    const updated = updater(old);
    if (updated) {
        map.set(id, updated);
    } else {
        map.delete(id);
    }
  },
});

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
            // GETs need to be idempotent, but we want to allow people to redirect to a URL with a normal browser redirect
            // so provide this GET version of the endpoint that just redirects to the POST version
            ctx.status = 200;
            ctx.body = `
              <html>
                <body>
                  <form id="continue-form" method="POST">
                    If you are not redirected, please press the button below.<br>
                    <input type="submit" value="Continue">
                  </form>
                  <script>
                    document.getElementById('continue-form').style.visibility = 'hidden';
                    document.getElementById('continue-form').submit();
                    setTimeout(() => {
                      document.getElementById('continue-form').style.visibility = 'visible';
                    }, 3000);
                  </script>
                </body>
              </html>
            `;
            ctx.header['content-type'] = 'text/html';
            break;
          }
          case 'POST': {
            const uid = ctx.path.split('/')[2];

            const grant = new oidc.Grant({
              accountId: "lmao_id",
              clientId: "client-id",
            });

            const grantId = await grant.save();


            const result = {
              login: {
                accountId: "lmao_id",
              },
              consent: {
                grantId,
              },
            };

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

