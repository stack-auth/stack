import { KnownErrors } from "@stackframe/stack-shared";
import { connectedAccountAccessTokenCrud } from "@stackframe/stack-shared/dist/interface/crud/oauth";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { extractScopes } from "@stackframe/stack-shared/dist/utils/strings";
import { usersCrudHandlers } from "@/app/api/v1/users/crud";
import { getProvider } from "@/oauth";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";

export const connectedAccountAccessTokenCrudHandlers = createLazyProxy(() =>
  createCrudHandlers(connectedAccountAccessTokenCrud, {
    paramsSchema: yupObject({
      provider_id: yupString().required(),
      user_id: yupString().required(),
    }),
    async onCreate({ auth, data, params }) {
      const userId = getIdFromUserIdOrMe(params.user_id, auth.user);

      if (auth.type === "client" && auth.user?.id !== userId) {
        throw new StatusError(StatusError.Forbidden, "Client can only access its own connected accounts");
      }

      const provider = auth.project.config.oauth_providers.find((p) => p.id === params.provider_id);
      if (!provider || !provider.enabled) {
        throw new KnownErrors.OAuthProviderNotFoundOrNotEnabled();
      }

      if (provider.type === "shared") {
        throw new KnownErrors.OAuthAccessTokenNotAvailableWithSharedOAuthKeys();
      }

      const user = await usersCrudHandlers.adminRead({ project: auth.project, user_id: userId });
      if (!user.oauth_providers.map((x) => x.id).includes(params.provider_id)) {
        throw new KnownErrors.OAuthConnectionNotConnectedToUser();
      }

      // ====================== retrieve access token if it exists ======================

      const accessTokens = await prismaClient.oAuthAccessToken.findMany({
        where: {
          projectId: auth.project.id,
          oAuthProviderConfigId: params.provider_id,
          projectUserOAuthAccount: {
            projectUserId: userId,
          },
          expiresAt: {
            // is at least 5 minutes in the future
            gt: new Date(Date.now() + 5 * 60 * 1000),
          },
        },
      });
      const filteredTokens = accessTokens.filter((t) => {
        return extractScopes(data.scope || "").every((scope) => t.scopes.includes(scope));
      });
      if (filteredTokens.length !== 0) {
        return { access_token: filteredTokens[0].accessToken };
      }

      // ============== no access token found, try to refresh the token ==============

      const refreshTokens = await prismaClient.oAuthToken.findMany({
        where: {
          projectId: auth.project.id,
          oAuthProviderConfigId: params.provider_id,
          projectUserOAuthAccount: {
            projectUserId: userId,
          },
        },
      });

      const filteredRefreshTokens = refreshTokens.filter((t) => {
        return extractScopes(data.scope || "").every((scope) => t.scopes.includes(scope));
      });

      if (filteredRefreshTokens.length === 0) {
        throw new KnownErrors.OAuthConnectionDoesNotHaveRequiredScope();
      }

      const tokenSet = await (
        await getProvider(provider)
      ).getAccessToken({
        refreshToken: filteredRefreshTokens[0].refreshToken,
        scope: data.scope,
      });

      if (!tokenSet.accessToken) {
        throw new StackAssertionError("No access token returned");
      }

      await prismaClient.oAuthAccessToken.create({
        data: {
          projectId: auth.project.id,
          oAuthProviderConfigId: provider.id,
          accessToken: tokenSet.accessToken,
          providerAccountId: filteredRefreshTokens[0].providerAccountId,
          scopes: filteredRefreshTokens[0].scopes,
          expiresAt: tokenSet.accessTokenExpiredAt,
        },
      });

      if (tokenSet.refreshToken) {
        // remove the old token, add the new token to the DB
        await prismaClient.oAuthToken.deleteMany({
          where: {
            refreshToken: filteredRefreshTokens[0].refreshToken,
          },
        });
        await prismaClient.oAuthToken.create({
          data: {
            projectId: auth.project.id,
            oAuthProviderConfigId: provider.id,
            refreshToken: tokenSet.refreshToken,
            providerAccountId: filteredRefreshTokens[0].providerAccountId,
            scopes: filteredRefreshTokens[0].scopes,
          },
        });
      }

      return { access_token: tokenSet.accessToken };
    },
  }),
);
