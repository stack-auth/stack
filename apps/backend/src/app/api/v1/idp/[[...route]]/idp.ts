import { prismaClient } from '@/prisma-client';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { StackAssertionError, captureError, throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import { sha512 } from '@stackframe/stack-shared/dist/utils/hashes';
import { getPerAudienceSecret, getPrivateJwk, getPublicJwkSet } from '@stackframe/stack-shared/dist/utils/jwt';
import Provider, { Adapter, AdapterConstructor, AdapterPayload } from 'oidc-provider';

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
    let wasCalled = false as boolean;  // casting due to https://stackoverflow.com/a/76698580
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

const PrismaAdapter = createAdapter({
  async onUpdateUnique(model, idOrWhere, updater) {
    await prismaClient.$transaction(async (tx) => {
      const oldAll = await tx.idPAdapterData.findMany({
        where: typeof idOrWhere === 'string' ? {
          model,
          id: idOrWhere,
          expiresAt: {
            gt: new Date(),
          },
        } : {
          model,
          payload: {
            path: [`${idOrWhere.propertyKey}`],
            equals: idOrWhere.propertyValue,
          },
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (oldAll.length > 1) throwErr(`Multiple ${model} found with ${idOrWhere}; this shouldn't happen`);
      const old = oldAll.length === 0 ? undefined : oldAll[0];

      const updated = updater(old ? {
        payload: old.payload as AdapterPayload,
        expiresAt: old.expiresAt,
      } : undefined);

      if (updated) {
        if (old) {
          await tx.idPAdapterData.update({
            where: {
              model_id: {
                model,
                id: old.id,
              },
            },
            data: {
              payload: updated.payload as any,
              expiresAt: updated.expiresAt,
            },
          });
        } else {
          await tx.idPAdapterData.create({
            data: {
              model,
              id: typeof idOrWhere === "string" ? idOrWhere : throwErr(`No ${model} found where ${JSON.stringify(idOrWhere)}`),
              payload: updated.payload as any,
              expiresAt: updated.expiresAt,
            },
          });
        }
      } else {
        if (old) {
          await tx.idPAdapterData.delete({
            where: {
              model_id: {
                model,
                id: old.id,
              },
            },
          });
        }
      }
    });
  },
});

// TODO: add stateful session management


export async function createOidcProvider(options: { baseUrl: string }) {
  const privateJwk = await getPrivateJwk(getPerAudienceSecret({
    audience: options.baseUrl,
    secret: getEnvVariable("STACK_SERVER_SECRET"),
  }));
  const privateJwks = {
    keys: [
      privateJwk,
    ],
  };
  const publicJwks = await getPublicJwkSet(privateJwk);

  const oidc = new Provider(options.baseUrl, {
    adapter: PrismaAdapter,
    clients: [{
      client_id: "client-id",
      client_secret: "test-client-secret",
      id_token_signed_response_alg: "ES256",
      redirect_uris: [
        `http://localhost:8116/api/auth/callback/stack-auth`,
      ],
    }],
    ttl: {
      Session: 1, // we always want to ask for login again immediately
    },
    cookies: {
      keys: [
        await sha512(`oidc-idp-cookie-encryption-key:${getEnvVariable("STACK_SERVER_SECRET")}`),
      ],
    },
    jwks: privateJwks,
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
      url: (ctx, interaction) => `${options.baseUrl}/interaction/${encodeURIComponent(interaction.uid)}`,

    },

    async renderError(ctx, out, error) {
      console.warn("IdP error occurred. This usually indicates a misconfigured client, not a server error.", error, { out });
      ctx.status = 400;
      ctx.type = "application/json";
      ctx.body = JSON.stringify(out);
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

  // .well-known/jwks.json
  oidc.use(async (ctx, next) => {
    if (ctx.path === '/.well-known/jwks.json') {
      ctx.body = publicJwks;
      ctx.type = 'application/json';
      return;
    }
    await next();
  });

  // Interactions
  oidc.use(async (ctx, next) => {
    try {
      if (/^\/interaction\/[^/]+\/login$/.test(ctx.path)) {
        switch (ctx.method) {
          case 'GET': {
            // GETs need to be idempotent, but we want to allow people to redirect to a URL with a normal browser redirect
            // so provide this GET version of the endpoint that just redirects to the POST version
            ctx.status = 200;
            ctx.type = 'text/html';
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
            return;
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
      } else if (ctx.method === 'GET' && /^\/interaction\/[^/]+$/.test(ctx.path)) {
        const uid = ctx.path.split('/')[2];
        return ctx.redirect(`http://localhost:8103/handler/sign-in?after_auth_return_to=${encodeURIComponent(`${options.baseUrl}/interaction/${encodeURIComponent(uid)}/login`)}`);
      }
    } catch (err) {
      captureError('idp-oidc-interaction-middleware', err);
      throw err;
    }
    await next();
  });

  return oidc;
}

