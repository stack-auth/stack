import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { generators } from "openid-client";
import { cookies } from "next/headers";
import { encryptJWT } from "stack-shared/dist/utils/jwt";
import { StatusError } from "stack-shared/dist/utils/errors";
import { smartRouteHandler, parseRequest } from "@/lib/route-handlers";
import { getAuthorizationUrl } from "@/oauth";
import { getProject } from "@/lib/projects";
import { checkApiKeySet } from "@/lib/api-keys";
import { ProjectIdOrKeyInvalidErrorCode, KnownError } from "stack-shared/dist/utils/types";

const getSchema = yup.object({
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

export const GET = smartRouteHandler(async (req: NextRequest, options: { params: { provider: string }}) => {
  // TODO: better error handling
  const {
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
  } = await parseRequest(req, getSchema);

  const providerId = options.params.provider;

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownError(ProjectIdOrKeyInvalidErrorCode);
  }

  const project = await getProject(projectId);

  if (!project) {
    // This should never happen, make typescript happy
    throw new Error("Project not found");
  }

  const provider = project.evaluatedConfig.oauthProviders.find((p) => p.id === providerId);
  if (!provider) {
    throw new StatusError(StatusError.NotFound, "Provider not found");
  }

  const innerCodeVerifier = generators.codeVerifier();
  const innerState = generators.state();
  const oauthUrl = await getAuthorizationUrl(
    provider,
    innerCodeVerifier,
    innerState,
  );

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
  });

  cookies().set("stack-oauth", cookie, {
    httpOnly: true,
    maxAge: 1000 * 60 * 5, // 5 minutes
  });
  return NextResponse.redirect(oauthUrl);
});
