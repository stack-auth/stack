import { getProvider } from "@/oauth";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { providerAccessTokenCrud } from "@stackframe/stack-shared/dist/interface/crud/oauth";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { extractScopes } from "@stackframe/stack-shared/dist/utils/strings";


export const providerAccessTokenCrudHandlers = createCrudHandlers(providerAccessTokenCrud, {
  paramsSchema: yupObject({
    provider: yupString().required(),
  }),
  async onCreate({ auth, data, params }) {
    if (!auth.user) throw new KnownErrors.UserNotFound();
    const provider = auth.project.config.oauth_providers.find((p) => p.id === params.provider);
    if (!provider || !provider.enabled) {
      throw new KnownErrors.OAuthProviderNotFoundOrNotEnabled();
    }

    if (provider.type === 'shared') {
      throw new KnownErrors.OAuthAccessTokenNotAvailableWithSharedOAuthKeys();
    }

    if (!auth.user.oauth_providers.map(x => x.id).includes(params.provider)) {
      throw new KnownErrors.OAuthConnectionNotConnectedToUser();
    }

    const tokens = await prismaClient.oAuthToken.findMany({
      where: {
        projectId: auth.project.id,
        oAuthProviderConfigId: params.provider,
        projectUserOAuthAccount: {
          projectUserId: auth.user.id,
        }
      },
    });

    const filteredTokens = tokens.filter((t) => {
      return extractScopes(data.scope || "").every((scope) => t.scopes.includes(scope));
    });

    if (filteredTokens.length === 0) {
      throw new KnownErrors.OAuthConnectionDoesNotHaveRequiredScope();
    }

    const tokenSet = await (await getProvider(provider)).getAccessToken({
      refreshToken: filteredTokens[0].refreshToken,
      scope: data.scope,
    });

    if (!tokenSet.access_token) {
      throw new StackAssertionError("No access token returned");
    }

    if (tokenSet.refresh_token) {
      // remove the old token, add the new token to the DB
      await prismaClient.oAuthToken.deleteMany({
        where: {
          refreshToken: filteredTokens[0].refreshToken,
        },
      });
      await prismaClient.oAuthToken.create({
        data: {
          projectId: auth.project.id,
          oAuthProviderConfigId: provider.id,
          refreshToken: tokenSet.refresh_token,
          providerAccountId: filteredTokens[0].providerAccountId,
          scopes: filteredTokens[0].scopes,
        }
      });
    }

    return {
      access_token: tokenSet.access_token,
    };
  },
});


