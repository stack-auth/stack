import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownErrors } from "@stackframe/stack-shared/dist/known-errors";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { sharedProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { generators } from "openid-client";
import { getProvider } from "@/oauth";
import { decodeAccessToken, oauthCookieSchema } from "@/lib/tokens";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getNodeEnvironment } from "@stackframe/stack-shared/dist/utils/env";
import { getProject } from "@/lib/projects";
import { checkApiKeySet } from "@/lib/api-keys";

const outerOAuthFlowExpirationInMinutes = 10;

export const GET = createSmartRouteHandler({
  request: yupObject({
    params: yupObject({
      provider: yupString().required(),
    }).required(),
    query: yupObject({
      // custom parameters
      type: yupString().oneOf(["authenticate", "link"]).default("authenticate"),
      token: yupString().default(""),
      provider_scope: yupString().optional(),
      error_redirect_url: yupString().optional(),

      // oauth parameters
      client_id: yupString().required(),
      client_secret: yupString().required(),
      redirect_uri: yupString().required(),
      scope: yupString().required(),
      state: yupString().required(),
      grant_type: yupString().oneOf(["authorization_code"]).required(),
      code_challenge: yupString().required(),
      code_challenge_method: yupString().required(),
      response_type: yupString().required(),
    }).required(),
  }),
  response: yupObject({
    // we never return as we always redirect
    statusCode: yupNumber().oneOf([302]).required(),
  }),
  async handler({ params, query }, fullReq) {
    const project = await getProject(query.client_id);

    if (!project) {
      throw new KnownErrors.ProjectNotFound();
    }

    if (!await checkApiKeySet(query.client_id, { publishableClientKey: query.client_secret })) {
      throw new KnownErrors.ApiKeyNotFound();
    }

    const provider = project.evaluatedConfig.oauthProviders.find((p) => p.id === params.provider);
    if (!provider || !provider.enabled) {
      throw new KnownErrors.OAuthProviderNotFoundOrNotEnabled();
    }

    // If the authorization token is present, we are adding new scopes to the user instead of sign-in/sign-up
    let projectUserId: string | undefined;
    if (query.type === "link") {
      const decodedAccessToken = await decodeAccessToken(query.token);
      const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

      if (accessTokenProjectId !== query.client_id) {
        throw new StatusError(StatusError.Forbidden, "The access token is not valid for this project");
      }

      if (query.provider_scope && sharedProviders.includes(provider.type as any)) {
        throw new KnownErrors.OAuthExtraScopeNotAvailableWithSharedOAuthKeys();
      }
      projectUserId = userId;
    }

    const innerCodeVerifier = generators.codeVerifier();
    const innerState = generators.state();
    const oauthUrl = getProvider(provider).getAuthorizationUrl({
      codeVerifier: innerCodeVerifier,
      state: innerState,
      extraScope: query.provider_scope,
    });
    
    const outerInfo = await prismaClient.oAuthOuterInfo.create({
      data: {
        innerState,
        info: {
          projectId: project.id,
          publishableClientKey: query.client_id,
          redirectUri: query.redirect_uri.split('#')[0], // remove hash
          scope: query.scope,
          state: query.state,
          grantType: query.grant_type,
          codeChallenge: query.code_challenge,
          codeChallengeMethod: query.code_challenge_method,
          responseType: query.response_type,
          innerCodeVerifier: innerCodeVerifier,
          type: query.type,
          projectUserId: projectUserId,
          providerScope: query.provider_scope,
          errorRedirectUrl: query.error_redirect_url,
        } satisfies yup.InferType<typeof oauthCookieSchema>,
        expiresAt: new Date(Date.now() + 1000 * 60 * outerOAuthFlowExpirationInMinutes),
      },
    });

    // prevent CSRF by keeping track of the inner state in cookies
    // the callback route must ensure that the inner state cookie is set
    cookies().set(
      "stack-oauth-inner-state-" + innerState,
      "true",
      {
        httpOnly: true,
        secure: getNodeEnvironment() !== "development",
        maxAge: 60 * outerOAuthFlowExpirationInMinutes,
      }
    );

    redirect(oauthUrl);
  },
});
