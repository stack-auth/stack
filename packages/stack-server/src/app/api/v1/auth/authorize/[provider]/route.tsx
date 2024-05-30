import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { generators } from "openid-client";
import { cookies } from "next/headers";
import { encryptJWT } from "@stackframe/stack-shared/dist/utils/jwt";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { getProvider } from "@/oauth";
import { getProject } from "@/lib/projects";
import { checkApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { KnownErrors } from "@stackframe/stack-shared";
import { authorizationHeaderSchema, decodeAccessToken, oauthCookieSchema } from "@/lib/tokens";

const getSchema = yup.object({
  header: yup.object({
    authorization: authorizationHeaderSchema.default(undefined),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(undefined),
    "x-stack-project-id": yup.string().default(undefined),
  }),
  query: yup.object({
    client_id: yup.string().required(),
    client_secret: yup.string().required(),
    redirect_uri: yup.string().required(),
    scope: yup.string().required(),
    state: yup.string().required(),
    grant_type: yup.string().required(),
    code_challenge: yup.string().required(),
    code_challenge_method: yup.string().required(),
    response_type: yup.string().required(),
  }),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { provider: string }}) => {
  const {
    header: {
      authorization,
      "x-stack-project-id": headerProjectId,
      "x-stack-publishable-client-key": headerPublishableClientKey,
    },
    query: {
      client_id: projectId,
      client_secret: publishableClientKey,
      redirect_uri: redirectUri,
      scope, 
      state, 
      grant_type: grantType,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      response_type: responseType,
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
  let authorizeSignedInUser = false;
  let projectUserId: string | undefined;
  if (authorization && headerProjectId && headerPublishableClientKey) {
    if (headerProjectId !== projectId || headerPublishableClientKey !== publishableClientKey) {
      throw new StatusError(StatusError.BadRequest, "project ID or publishable client key mismatch");
    }

    const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
    const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

    if (accessTokenProjectId !== projectId) {
      throw new StatusError(StatusError.Forbidden);
    }
    authorizeSignedInUser = true;
    projectUserId = userId;
  }

  const innerCodeVerifier = generators.codeVerifier();
  const innerState = generators.state();
  const oauthUrl = await getProvider(provider).getAuthorizationUrl({
    codeVerifier: innerCodeVerifier,
    state: innerState,
  });

  const cookie = await encryptJWT({
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
    authorizeSignedInUser,
    projectUserId,
  } satisfies yup.InferType<typeof oauthCookieSchema>);

  cookies().set("stack-oauth", cookie, {
    httpOnly: true,
    maxAge: 1000 * 60 * 5, // 5 minutes
  });
  return NextResponse.redirect(oauthUrl);
});
