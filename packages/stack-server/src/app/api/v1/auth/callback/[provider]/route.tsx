import * as yup from "yup";
import { cookies } from "next/headers";
import { InvalidClientError, Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";
import { NextRequest } from "next/server";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { decryptJWT } from "@stackframe/stack-shared/dist/utils/jwt";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { getProvider, oauthServer } from "@/oauth";
import { prismaClient } from "@/prisma-client";
import { checkApiKeySet } from "@/lib/api-keys";
import { getProject } from "@/lib/projects";
import { KnownError, KnownErrors, ProjectJson } from "@stackframe/stack-shared";
import { createTeamOnSignUp, getServerUser } from "@/lib/users";
import { oauthCookieSchema } from "@/lib/tokens";
import { extractScopes } from "@stackframe/stack-shared/dist/utils/strings";
import { validateUrl } from "@/lib/utils";
import { Project } from "@stackframe/stack";

const redirectOrThrowError = (error: KnownError, project: Project | ProjectJson, errorRedirectUrl?: string) => {
  if (!errorRedirectUrl || !validateUrl(errorRedirectUrl, project.evaluatedConfig.domains, project.evaluatedConfig.allowLocalhost)) {
    throw error;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${errorRedirectUrl}?errorCode=${error.errorCode}&message=${error.message}&details=${error.details}`,
    },
  });
};

const getSchema = yup.object({
  query: yup.object({
    code: yup.string().required(),
    state: yup.string().required(),  
  })
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { provider: string }}) => {
  const { query: {
    code,
    state,
  } } = await deprecatedParseRequest(req, getSchema);

  const providerId = options.params.provider;

  const cookie = cookies().get("stack-oauth");
  if (!cookie) {
    throw new StatusError(StatusError.BadRequest, "stack-oauth cookie not found");
  }

  let decodedCookie: Awaited<ReturnType<typeof oauthCookieSchema.validate>>;
  try {
    decodedCookie = await oauthCookieSchema.validate(await decryptJWT(cookie.value));
  } catch (error) {
    console.warn("Invalid stack-oauth cookie value", { cause: error });
    throw new StatusError(StatusError.BadRequest, "Invalid stack-oauth cookie value. Please try signing in again."); 
  }

  const {
    projectId,
    publishableClientKey,
    innerCodeVerifier,
    innerState,
    type,
    projectUserId,
    providerScope,
    errorRedirectUrl,
    afterCallbackRedirectUrl,
  } = decodedCookie;

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownErrors.ApiKeyNotFound();
  }

  const project = await getProject(projectId);

  if (!project) {
    // This should never happen, make typescript happy
    throw new StackAssertionError("Project not found");
  }

  const provider = project.evaluatedConfig.oauthProviders.find((p) => p.id === providerId);
  if (!provider || !provider.enabled) {
    throw new StatusError(StatusError.NotFound, "Provider not found or not enabled");
  }

  const userInfo = await getProvider(provider).getCallback({
    codeVerifier: innerCodeVerifier,
    state: innerState,
    callbackParams: {
      code,
      state,
    }
  });

  if (type === "link") {
    if (!projectUserId) {
      throw new StackAssertionError("projectUserId not found in cookie when authorizing signed in user");
    }

    const user = await prismaClient.projectUser.findUnique({
      where: {
        projectId_projectUserId: {
          projectId,
          projectUserId,
        },
      },
      include: {
        projectUserOAuthAccounts: {
          include: {
            providerConfig: true,
          }
        }
      }
    });
    if (!user) {
      throw new StackAssertionError("User not found");
    }

    const account = user.projectUserOAuthAccounts.find((a) => a.providerConfig.id === provider.id);
    if (account && account.providerAccountId !== userInfo.accountId) {
      return redirectOrThrowError(new KnownErrors.UserAlreadyConnectedToAnotherOAuthConnection(), project, errorRedirectUrl);
    }
  }
  
  const oauthRequest = new OAuthRequest({
    headers: {},
    body: {},
    method: "GET",
    query: {
      client_id: decodedCookie.projectId,
      client_secret: decodedCookie.publishableClientKey,
      redirect_uri: decodedCookie.redirectUri,
      state: decodedCookie.state,
      scope: decodedCookie.scope,
      grant_type: decodedCookie.grantType,
      code_challenge: decodedCookie.codeChallenge,
      code_challenge_method: decodedCookie.codeChallengeMethod,
      response_type: decodedCookie.responseType,
    }
  });

  const storeRefreshToken = async () => {
    if (userInfo.refreshToken) {
      await prismaClient.oAuthToken.create({
        data: {
          projectId: decodedCookie.projectId,
          oAuthProviderConfigId: provider.id,
          refreshToken: userInfo.refreshToken,
          providerAccountId: userInfo.accountId,
          scopes: extractScopes(getProvider(provider).scope + " " + providerScope),
        }
      });
    }
  };

  const oauthResponse = new OAuthResponse();
  try {
    await oauthServer.authorize(
      oauthRequest,
      oauthResponse,
      {
        authenticateHandler: {
          handle: async () => {
            const oldAccount = await prismaClient.projectUserOAuthAccount.findUnique({
              where: {
                projectId_oauthProviderConfigId_providerAccountId: {
                  projectId: decodedCookie.projectId,
                  oauthProviderConfigId: provider.id,
                  providerAccountId: userInfo.accountId,
                },
              },
            });

            // ========================== link account with user ==========================
            if (type === "link") {
              if (!projectUserId) {
                throw new StackAssertionError("projectUserId not found in cookie when authorizing signed in user");
              }

              if (oldAccount) {
                // ========================== account already connected ==========================
                if (oldAccount.projectUserId !== projectUserId) {
                  throw new KnownErrors.OAuthConnectionAlreadyConnectedToAnotherUser();
                }
                await storeRefreshToken();
              } else {
                // ========================== connect account with user ==========================
                await prismaClient.projectUserOAuthAccount.create({
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
                      connect: {
                        projectId_projectUserId: {
                          projectId: decodedCookie.projectId,
                          projectUserId: projectUserId,
                        },
                      },
                    },
                  },
                });
              }
              
              await storeRefreshToken();
              return {
                id: projectUserId,
                newUser: false,
                afterCallbackRedirectUrl,
              };
            }
            
            // ========================== sign in user ==========================

            if (oldAccount) {
              await storeRefreshToken();

              return {
                id: oldAccount.projectUserId,
                newUser: false,
                afterCallbackRedirectUrl,
              };
            }

            // ========================== sign up user ==========================

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
                    authWithEmail: false,
                  },
                },
              },
            });

            await createTeamOnSignUp(projectId, newAccount.projectUserId);
            await storeRefreshToken();
            return {
              id: newAccount.projectUserId,
              newUser: true,
              afterCallbackRedirectUrl,
            };
          }
        }
      }
    );
  } catch (error) {
    if (error instanceof InvalidClientError) {
      if (error.message.includes("redirect_uri")) {
        throw new StatusError(
          StatusError.BadRequest, 
          'Invalid redirect URL. This is probably caused by not setting up domains/handlers correctly in the Stack dashboard'
        );
      }
      throw new StatusError(StatusError.BadRequest, error.message);
    } else if (error instanceof KnownErrors.OAuthConnectionAlreadyConnectedToAnotherUser) {
      return redirectOrThrowError(error, project, errorRedirectUrl);
    }
    throw error;
  }

  return new Response(JSON.stringify(oauthResponse.body), {
    status: oauthResponse.status,
    headers: oauthResponse.headers
  });
});
