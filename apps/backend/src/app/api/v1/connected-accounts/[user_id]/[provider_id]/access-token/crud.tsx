import { usersCrudHandlers } from "@/app/api/v1/users/crud";
import { getProvider } from "@/oauth";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";
import { KnownErrors } from "@stackframe/stack-shared";
import { connectedAccountAccessTokenCrud } from "@stackframe/stack-shared/dist/interface/crud/oauth";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { extractScopes } from "@stackframe/stack-shared/dist/utils/strings";


export const connectedAccountAccessTokenCrudHandlers = createLazyProxy(() =>createCrudHandlers(connectedAccountAccessTokenCrud, {
  paramsSchema: yupObject({
    provider_id: yupString().required(),
    user_id: yupString().required(),
  }),
  async onCreate({ auth, data, params }) {
    const userId = getIdFromUserIdOrMe(params.user_id, auth.user);

    if (auth.type === 'client' && auth.user?.id !== userId) {
      throw new StatusError(StatusError.Forbidden, "Client can only access its own connected accounts");
    }

    const provider = auth.project.config.oauth_providers.find((p) => p.id === params.provider_id);
    if (!provider || !provider.enabled) {
      throw new KnownErrors.OAuthProviderNotFoundOrNotEnabled();
    }

    if (provider.type === 'shared') {
      throw new KnownErrors.OAuthAccessTokenNotAvailableWithSharedOAuthKeys();
    }

    const user = await usersCrudHandlers.adminRead({ project: auth.project, user_id: userId });
    if (!user.oauth_providers.map(x => x.id).includes(params.provider_id)) {
      throw new KnownErrors.OAuthConnectionNotConnectedToUser();
    }

    const tokens = await prismaClient.oAuthToken.findMany({
      where: {
        projectId: auth.project.id,
        oAuthProviderConfigId: params.provider_id,
        projectUserOAuthAccount: {
          projectUserId: userId,
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

    return { access_token: tokenSet.access_token };
  },
}));


