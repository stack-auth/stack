import { prismaClient } from '@/prisma-client';
import { Prisma } from '@prisma/client';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { StackAssertionError, captureError, throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import { sha512 } from '@stackframe/stack-shared/dist/utils/hashes';
import { getPerAudienceSecret, getPrivateJwk, getPublicJwkSet } from '@stackframe/stack-shared/dist/utils/jwt';
import { generateUuid } from '@stackframe/stack-shared/dist/utils/uuids';
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
      try {
        if (expiresInSeconds < 0) throw new StackAssertionError(`expiresInSeconds of ${this.model}:${id} must be non-negative, got ${expiresInSeconds}`, { expiresInSeconds, model: this.model, id, payload });
        if (expiresInSeconds > 60 * 60 * 24 * 365 * 100) throw new StackAssertionError(`expiresInSeconds of ${this.model}:${id} must be less than 100 years, got ${expiresInSeconds}`, { expiresInSeconds, model: this.model, id, payload });
        if (!Number.isFinite(expiresInSeconds)) throw new StackAssertionError(`expiresInSeconds of ${this.model}:${id} must be a finite number, got ${expiresInSeconds}`, { expiresInSeconds, model: this.model, id, payload });
      } catch (err) {
        captureError('idp-adapter-upsert-assertion-error', err);
        expiresInSeconds = 60 * 60 * 60 * 24;
      }

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

function createPrismaAdapter(idpId: string) {
  return createAdapter({
    async onUpdateUnique(model, idOrWhere, updater) {
      await prismaClient.$transaction(async (tx) => {
        const oldAll = await tx.idPAdapterData.findMany({
          where: typeof idOrWhere === 'string' ? {
            idpId,
            model,
            id: idOrWhere,
            expiresAt: {
              gt: new Date(),
            },
          } : {
            idpId,
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
                idpId_model_id: {
                  idpId,
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
                idpId,
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
                idpId_model_id: {
                  idpId,
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
}

// TODO: add stateful session management


export async function createOidcProvider(options: { id: string, baseUrl: string }) {
  const privateJwk = await getPrivateJwk(getPerAudienceSecret({
    audience: `https://idp-jwk-audience.stack-auth.com/${encodeURIComponent(options.id)}`,
    secret: getEnvVariable("STACK_SERVER_SECRET"),
  }));
  const privateJwks = {
    keys: [
      privateJwk,
    ],
  };
  const publicJwks = await getPublicJwkSet(privateJwk);

  const oidc = new Provider(options.baseUrl, {
    adapter: createPrismaAdapter(options.id),
    clients: JSON.parse(getEnvVariable("STACK_NEON_INTEGRATION_CLIENTS_CONFIG", "[]")),
    ttl: {
      Session: 60, // we always want to ask for login again, though the session needs to survive for a bit during the token exchange
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
    scopes: [],
    responseTypes: [
      "code",
    ],

    interactions: {
      url: (ctx, interaction) => `${options.baseUrl}/interaction/${encodeURIComponent(interaction.uid)}`,
    },

    async renderError(ctx, out, error) {
      console.warn("IdP error occurred. This usually indicates a misconfigured client, not a server error.", error, { out });
      ctx.status = 400;
      ctx.type = "application/json";
      ctx.body = JSON.stringify(out);
    },

    async findAccount(ctx, sub, token) {
      return {
        accountId: sub,
        async claims(use, scope, claims, rejected) {
          return { sub };
        },
      };
    },
  });

  oidc.on('server_error', (ctx, err) => {
    captureError('idp-oidc-provider-server-error', err);
  });

  function middleware(mw: Parameters<typeof oidc.use>[0]) {
    oidc.use((ctx, next) => {
      try {
        return mw(ctx, next);
      } catch (err) {
        captureError('idp-oidc-provider-middleware-error', err);
        throw err;
      }
    });
  }

  // .well-known/jwks.json
  middleware(async (ctx, next) => {
    if (ctx.path === '/.well-known/jwks.json') {
      ctx.body = publicJwks;
      ctx.type = 'application/json';
      return;
    }
    await next();
  });

  // Interactions
  middleware(async (ctx, next) => {
    if (/^\/interaction\/[^/]+\/done$/.test(ctx.path)) {
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
          const authorizationCode = `${ctx.request.query.code}`;
          const authorizationCodeObj = await prismaClient.projectWrapperCodes.findUnique({
            where: {
              idpId: "stack-preconfigured-idp:integrations/neon",
              authorizationCode,
            },
          });

          if (!authorizationCodeObj) {
            ctx.status = 400;
            ctx.type = "text/plain";
            ctx.body = "Invalid authorization code. Please try again.";
            return;
          }

          await prismaClient.projectWrapperCodes.delete({
            where: {
              idpId_id: {
                idpId: authorizationCodeObj.idpId,
                id: authorizationCodeObj.id,
              },
            },
          });

          const interactionDetails = await oidc.interactionDetails(ctx.req, ctx.res);

          const uid = ctx.path.split('/')[2];
          if (uid !== authorizationCodeObj.interactionUid) {
            ctx.status = 400;
            ctx.type = "text/plain";
            ctx.body = "Different interaction UID than expected from the authorization code. Did you redirect to the correct URL?";
            return;
          }

          const account = await prismaClient.idPAccountToCdfcResultMapping.create({
            data: {
              idpId: authorizationCodeObj.idpId,
              id: authorizationCodeObj.id,
              idpAccountId: generateUuid(),
              cdfcResult: authorizationCodeObj.cdfcResult ?? Prisma.JsonNull,
            },
          });

          const grant = new oidc.Grant({
            accountId: account.idpAccountId,
            clientId: interactionDetails.params.client_id as string,
          });
          grant.addOIDCScope('openid profile');

          const grantId = await grant.save(60 * 60 * 24);

          const result = {
            login: {
              accountId: account.idpAccountId,
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
      const interactionUrl = new URL(`/integrations/neon/confirm`, getEnvVariable("NEXT_PUBLIC_STACK_DASHBOARD_URL"));
      interactionUrl.searchParams.set("interaction_uid", uid);
      return ctx.redirect(interactionUrl.toString());
    }
    await next();
  });

  return oidc;
}

