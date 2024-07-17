import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { InvalidClientError, Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";
import { sendEmailFromTemplate } from "@/lib/emails";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownError, KnownErrors } from "@stackframe/stack-shared";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";
import { sharedProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { generators } from "openid-client";
import { getProvider, oauthServer } from "@/oauth";
import { decodeAccessToken, oauthCookieSchema } from "@/lib/tokens";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProject } from "@/lib/projects";
import { validateRedirectUrl } from "@/lib/redirect-urls";
import { extractScopes } from "@stackframe/stack-shared/dist/utils/strings";
import { usersCrudHandlers } from "@/app/api/v1/users/crud";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";

const redirectOrThrowError = (error: KnownError, project: ProjectsCrud["Admin"]["Read"], errorRedirectUrl?: string) => {
  if (!errorRedirectUrl || !validateRedirectUrl(errorRedirectUrl, project.config.domains, project.config.allow_localhost)) {
    throw error;
  }

  redirect(`${errorRedirectUrl}?errorCode=${error.errorCode}&message=${error.message}&details=${error.details}`);
};

export const GET = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    params: yupObject({
      provider: yupString().required(),
    }).required(),
    query: yupObject({
      code: yupString().required(),
      state: yupString().required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupMixed().required(),
    headers: yupMixed().required(),
  }),
  async handler({ params, query }, fullReq) {
    const cookieInfo = cookies().get("stack-oauth-" + query.state);
    cookies().delete("stack-oauth-" + query.state);

    if (cookieInfo?.value !== 'true') {
      throw new StatusError(StatusError.BadRequest, "stack-oauth cookie not found");
    }

    const outerInfoDB = await prismaClient.oAuthOuterInfo.findUnique({
      where: {
        innerState: query.state,
      },
    });

    if (!outerInfoDB) {
      throw new StatusError(StatusError.BadRequest, "Invalid stack-oauth cookie value. Please try signing in again.");
    }

    let outerInfo: Awaited<ReturnType<typeof oauthCookieSchema.validate>>;
    try {
      outerInfo = await oauthCookieSchema.validate(outerInfoDB.info);
    } catch (error) {
      throw new StackAssertionError("Invalid outer info");
    }

    const {
      projectId,
      innerCodeVerifier,
      type,
      projectUserId,
      providerScope,
      errorRedirectUrl,
      afterCallbackRedirectUrl,
    } = outerInfo;

    const project = await getProject(projectId);

    if (!project) {
      throw new StatusError(StatusError.BadRequest, "Invalid project ID");
    }

    if (outerInfoDB.expiresAt < new Date()) {
      redirectOrThrowError(new KnownErrors.OuterOAuthTimeout(), project, errorRedirectUrl);
    }

    const provider = project.config.oauth_providers.find((p) => p.id === params.provider);
    if (!provider || !provider.enabled) {
      throw new KnownErrors.OAuthProviderNotFoundOrNotEnabled();
    }

    const userInfo = await getProvider(provider).getCallback({
      codeVerifier: innerCodeVerifier,
      state: query.state,
      callbackParams: {
        code: query.code,
        state: query.state,
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
        client_id: outerInfo.projectId,
        client_secret: outerInfo.publishableClientKey,
        redirect_uri: outerInfo.redirectUri,
        state: outerInfo.state,
        scope: outerInfo.scope,
        grant_type: outerInfo.grantType,
        code_challenge: outerInfo.codeChallenge,
        code_challenge_method: outerInfo.codeChallengeMethod,
        response_type: outerInfo.responseType,
      }
    });

    const storeRefreshToken = async () => {
      if (userInfo.refreshToken) {
        await prismaClient.oAuthToken.create({
          data: {
            projectId: outerInfo.projectId,
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
                    projectId: outerInfo.projectId,
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
                            projectConfigId: project.config.id,
                            id: provider.id,
                          },
                        },
                      },
                      projectUser: {
                        connect: {
                          projectId_projectUserId: {
                            projectId: outerInfo.projectId,
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

              const newAccount = await usersCrudHandlers.serverCreate({
                project,
                data: {
                  display_name: userInfo.displayName,
                  profile_image_url: userInfo.profileImageUrl || undefined,
                  primary_email: userInfo.email,
                  primary_email_verified: false, // TODO: check if email is verified with the provider
                  primary_email_auth_enabled: false,
                  oauth_providers: [{
                    id: provider.id,
                    account_id: userInfo.accountId,
                    email: userInfo.email,
                  }],
                }
              });
              await storeRefreshToken();
              return {
                id: newAccount.id,
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

    return {
      statusCode: oauthResponse.status || 200,
      bodyType: "json",
      body: oauthResponse.body,
      headers: Object.fromEntries(Object.entries(oauthResponse.headers || {}).map(([k, v]) => ([k, [v]]))),
    };
  },
});
