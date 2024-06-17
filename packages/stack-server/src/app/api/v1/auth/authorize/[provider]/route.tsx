import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { generators } from "openid-client";
import { cookies } from "next/headers";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { getProvider } from "@/oauth";
import { getProject } from "@/lib/projects";
import { checkApiKeySet } from "@/lib/api-keys";
import { KnownErrors } from "@stackframe/stack-shared";
import { decodeAccessToken, oauthCookieSchema } from "@/lib/tokens";
import { sharedProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { prismaClient } from "@/prisma-client";


const expireMinutes = 10;

const getSchema = yup.object({
  query: yup.object({
    // custom parameters
    type: yup.string().oneOf(["authenticate", "link"]).default("authenticate"),
    token: yup.string().default(""),
    providerScope: yup.string().optional(),
    errorRedirectUrl: yup.string().optional(),
    afterCallbackRedirectUrl: yup.string().optional(),

    // oauth parameters
    client_id: yup.string().required(),
    client_secret: yup.string().required(),
    redirect_uri: yup.string().required(),
    scope: yup.string().required(),
    state: yup.string().required(),
    grant_type: yup.string().oneOf(["authorization_code"]).required(),
    code_challenge: yup.string().required(),
    code_challenge_method: yup.string().required(),
    response_type: yup.string().required(),
  }),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { provider: string }}) => {
  const {
    query: {
      type,
      token,
      providerScope,
      client_id: projectId,
      client_secret: publishableClientKey,
      redirect_uri: redirectUri,
      scope, 
      state, 
      grant_type: grantType,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      response_type: responseType,
      errorRedirectUrl,
      afterCallbackRedirectUrl
    }
  } = await deprecatedParseRequest(req, getSchema);

  const providerId = options.params.provider;

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownErrors.ApiKeyNotFound();
  }

  const project = await getProject(projectId);

  if (!project) {
    // This should never happen, make typescript happy
    throw new StackAssertionError("Project not found");
  }

  const provider = project.evaluatedConfig.oauthProviders.find((p) => p.id === providerId);
  if (!provider) {
    throw new StatusError(StatusError.NotFound, "Provider not found");
  }
  if (!provider.enabled) {
    throw new StatusError(StatusError.NotFound, "Provider not enabled");
  }

  // If the authorization header is present, we are adding new scopes to the user instead of sign-in/sign-up
  let projectUserId: string | undefined;
  if (type === "link") {
    const decodedAccessToken = await decodeAccessToken(token);
    const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

    if (accessTokenProjectId !== projectId) {
      throw new StatusError(StatusError.Forbidden);
    }

    if (providerScope && sharedProviders.includes(provider.type as any)) {
      throw new KnownErrors.OAuthExtraScopeNotAvailableWithSharedOAuthKeys();
    }
    projectUserId = userId;
  }

  const innerCodeVerifier = generators.codeVerifier();
  const innerState = generators.state();
  const oauthUrl = getProvider(provider).getAuthorizationUrl({
    codeVerifier: innerCodeVerifier,
    state: innerState,
    extraScope: providerScope,
  });

  const outerInfo = await prismaClient.oAuthOuterInfo.create({
    data: {
      info: {
        projectId,
        publishableClientKey,
        redirectUri: redirectUri.split('#')[0], // remove hash
        scope,
        state,
        grantType,
        codeChallenge,
        codeChallengeMethod,
        responseType,
        innerCodeVerifier,
        innerState,
        type,
        projectUserId,
        providerScope,
        errorRedirectUrl,
        afterCallbackRedirectUrl,
      } satisfies yup.InferType<typeof oauthCookieSchema>,
      expiresAt: new Date(Date.now() + 1000 * 60 * expireMinutes),
    },
  });

  cookies().set(
    "stack-oauth-" + innerState.slice(0, 8),
    outerInfo.id, 
    {
      httpOnly: true,
      maxAge: 60 * expireMinutes,
    }
  );
  cookies().delete("stack-oauth"); // remove the old cookie from the old version
  return NextResponse.redirect(oauthUrl);
});
