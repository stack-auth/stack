import * as yup from "yup";
import { cookies } from "next/headers";
import { Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";
import { NextRequest } from "next/server";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { decryptJWT } from "@stackframe/stack-shared/dist/utils/jwt";
import { deprecatedSmartRouteHandler, deprecatedParseRequest as deprecatedParseRequest } from "@/lib/route-handlers";
import { getAuthorizationCallback, oauthServer } from "@/oauth";
import { prismaClient } from "@/prisma-client";
import { checkApiKeySet } from "@/lib/api-keys";
import { getProject } from "@/lib/projects";
import { KnownErrors } from "@stackframe/stack-shared";

const getSchema = yup.object({
  query: yup.object({
    code: yup.string().required(),
    state: yup.string().required(),  
  })
});

const jwtSchema = yup.object({
  projectId: yup.string().required(),
  publishableClientKey: yup.string().required(),
  innerCodeVerifier: yup.string().required(),
  innerState: yup.string().required(),
  redirectUri: yup.string().required(),
  scope: yup.string().required(),
  state: yup.string().required(),
  grantType: yup.string().required(),
  codeChallenge: yup.string().required(),
  codeChallengeMethod: yup.string().required(),
  responseType: yup.string().required(),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { provider: string }}) => {
  // TODO: better error handling
  const { query: {
    code,
    state,
  } } = await deprecatedParseRequest(req, getSchema);

  const providerId = options.params.provider;

  const cookie = cookies().get("stack-oauth");
  if (!cookie) {
    throw new Error("stack-oauth cookie not found");
  }

  let decoded: Awaited<ReturnType<typeof jwtSchema.validate>>;
  try {
    decoded = await jwtSchema.validate(await decryptJWT(cookie.value));
  } catch (error) {
    console.warn("Invalid stack-oauth cookie value", { cause: error });
    throw new StatusError(StatusError.BadRequest, "Invalid stack-oauth cookie value. Please try signing in again."); 
  }

  const {
    projectId,
    publishableClientKey,
    innerCodeVerifier,
    innerState,
  } = decoded;

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownErrors.ApiKeyNotFound();
  }

  const project = await getProject(projectId);

  if (!project) {
    // This should never happen, make typescript happy
    throw new Error("Project not found");
  }

  const provider = project.evaluatedConfig.oauthProviders.find((p) => p.id === providerId);
  if (!provider || !provider.enabled) {
    throw new StatusError(StatusError.NotFound, "Provider not found or not enabled");
  }

  const userInfo = await getAuthorizationCallback(
    provider,
    innerCodeVerifier,
    innerState,
    {
      code,
      state,
    }
  );
  
  const oauthRequest = new OAuthRequest({
    headers: {},
    body: {},
    method: "GET",
    query: {
      client_id: decoded.projectId,
      client_secret: decoded.publishableClientKey,
      redirect_uri: decoded.redirectUri,
      state: decoded.state,
      scope: decoded.scope,
      grant_type: decoded.grantType,
      code_challenge: decoded.codeChallenge,
      code_challenge_method: decoded.codeChallengeMethod,
      response_type: decoded.responseType,
    }
  });

  const oauthResponse = new OAuthResponse();
  await oauthServer.authorize(
    oauthRequest,
    oauthResponse,
    {
      authenticateHandler: {
        handle: async () => {
          const oldAccount = await prismaClient.projectUserOAuthAccount.findUnique({
            where: {
              projectId_oauthProviderConfigId_providerAccountId: {
                projectId: decoded.projectId,
                oauthProviderConfigId: provider.id,
                providerAccountId: userInfo.accountId,
              },
            },
          });

          if (oldAccount) {
            return {
              id: oldAccount.projectUserId,
              newUser: false
            };
          }

          const newAccount = await prismaClient.projectUserOAuthAccount.create({
            data: {
              providerAccountId: userInfo.accountId,
              email: userInfo.email,
              providerConfig: {
                connect: {
                  projectConfigId_id: {
                    projectConfigId: project.evaluatedConfig.id,
                    id: provider.id,
                  },
                },
              },
              projectUser: {
                create: {
                  projectId,
                  displayName: userInfo.displayName,
                  profileImageUrl: userInfo.profileImageUrl,
                  primaryEmail: userInfo.email,
                  primaryEmailVerified: true,
                },
              },
            },
          });

          return {
            id: newAccount.projectUserId,
            newUser: true
          };
        }
      }
    }
  );

  return new Response(JSON.stringify(oauthResponse.body), {
    status: oauthResponse.status,
    headers: oauthResponse.headers
  });
});
