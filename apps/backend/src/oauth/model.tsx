import { AuthorizationCode, AuthorizationCodeModel, Client, Falsey, RefreshToken, Token, User } from "@node-oauth/oauth2-server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { KnownErrors } from "@stackframe/stack-shared";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { createMfaRequiredError } from "@/app/api/v1/auth/mfa/sign-in/verification-code-handler";
import { checkApiKeySet } from "@/lib/api-keys";
import { fullProjectInclude, projectPrismaToCrud } from "@/lib/projects";
import { getProject } from "@/lib/projects";
import { validateRedirectUrl } from "@/lib/redirect-urls";
import { decodeAccessToken, generateAccessToken } from "@/lib/tokens";
import { prismaClient } from "@/prisma-client";

const enabledScopes = ["legacy"];

function assertScopeIsValid(scope: string[]) {
  for (const s of scope) {
    if (!checkScope(s)) {
      throw new KnownErrors.InvalidScope(s);
    }
  }
}

function checkScope(scope: string | string[] | undefined) {
  if (typeof scope === "string") {
    return enabledScopes.includes(scope);
  } else if (Array.isArray(scope)) {
    return scope.every((s) => enabledScopes.includes(s));
  } else {
    return false;
  }
}

export class OAuthModel implements AuthorizationCodeModel {
  async getClient(clientId: string, clientSecret: string): Promise<Client | Falsey> {
    if (clientSecret) {
      const keySet = await checkApiKeySet(clientId, { publishableClientKey: clientSecret });
      if (!keySet) {
        return false;
      }
    }

    const project = await getProject(clientId);
    if (!project) {
      return false;
    }

    const redirectUris = project.config.domains.map(({ domain, handler_path }) => new URL(handler_path, domain).toString());

    if (redirectUris.length === 0 && project.config.allow_localhost) {
      redirectUris.push("http://localhost");
    }

    return {
      id: project.id,
      grants: ["authorization_code", "refresh_token"],
      redirectUris: redirectUris,
    };
  }

  async validateScope(user: User | null, client: Client | null, scope?: string[]): Promise<string[] | Falsey> {
    if (!user) {
      return false;
    }

    if (!client) {
      return false;
    }

    return checkScope(scope) ? scope : false;
  }

  async generateAccessToken(client: Client, user: User, scope: string[]): Promise<string> {
    assertScopeIsValid(scope);
    return await generateAccessToken({
      projectId: client.id,
      userId: user.id,
    });
  }

  async generateRefreshToken(client: Client, user: User, scope: string[]): Promise<string> {
    assertScopeIsValid(scope);

    return generateSecureRandomString();
  }

  async saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
    if (token.refreshToken) {
      const projectUser = await prismaClient.projectUser.findUniqueOrThrow({
        where: {
          projectId_projectUserId: {
            projectId: client.id,
            projectUserId: user.id,
          },
        },
        include: {
          project: {
            include: fullProjectInclude,
          },
        },
      });
      if (projectUser.requiresTotpMfa) {
        throw await createMfaRequiredError({
          project: projectPrismaToCrud(projectUser.project),
          userId: projectUser.projectUserId,
          isNewUser: false,
        });
      }

      await prismaClient.projectUserRefreshToken.create({
        data: {
          refreshToken: token.refreshToken,
          expiresAt: token.refreshTokenExpiresAt,
          projectUser: {
            connect: {
              projectId_projectUserId: {
                projectId: client.id,
                projectUserId: user.id,
              },
            },
          },
        },
      });
    }

    token.client = client;
    token.user = user;
    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      scope: token.scope,
      client: token.client,
      user: token.user,

      // TODO remove deprecated camelCase properties
      newUser: user.newUser,
      is_new_user: user.newUser,
      afterCallbackRedirectUrl: user.afterCallbackRedirectUrl,
      after_callback_redirect_url: user.afterCallbackRedirectUrl,
    };
  }

  async getAccessToken(accessToken: string): Promise<Token | Falsey> {
    let decoded;
    try {
      decoded = await decodeAccessToken(accessToken);
    } catch (e) {
      captureError("getAccessToken", e);
      return false;
    }

    return {
      accessToken,
      accessTokenExpiresAt: new Date(decoded.exp * 1000),
      user: {
        id: decoded.userId,
      },
      client: {
        id: decoded.projectId,
        grants: ["authorization_code", "refresh_token"],
      },
      scope: enabledScopes,
    };
  }

  async getRefreshToken(refreshToken: string): Promise<RefreshToken | Falsey> {
    const token = await prismaClient.projectUserRefreshToken.findUnique({
      where: {
        refreshToken,
      },
    });

    if (!token) {
      return false;
    }

    return {
      refreshToken,
      refreshTokenExpiresAt: token.expiresAt === null ? undefined : token.expiresAt,
      user: {
        id: token.projectUserId,
      },
      client: {
        id: token.projectId,
        grants: ["authorization_code", "refresh_token"],
      },
      scope: enabledScopes,
    };
  }

  // TODO: This function isn't used. Determine if it should be removed.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async revokeToken(token: RefreshToken): Promise<boolean> {
    // No refreshToken rotation for now (see Git history for old code)
    return true;
  }

  async verifyScope(token: Token, scope: string[]): Promise<boolean> {
    return checkScope(scope);
  }

  async saveAuthorizationCode(
    code: Pick<AuthorizationCode, "authorizationCode" | "expiresAt" | "redirectUri" | "scope" | "codeChallenge" | "codeChallengeMethod">,
    client: Client,
    user: User,
  ): Promise<AuthorizationCode | Falsey> {
    if (!code.scope) {
      throw new KnownErrors.InvalidScope("<empty string>");
    }
    assertScopeIsValid(code.scope);
    await prismaClient.projectUserAuthorizationCode.create({
      data: {
        authorizationCode: code.authorizationCode,
        codeChallenge: code.codeChallenge || "",
        codeChallengeMethod: code.codeChallengeMethod || "",
        redirectUri: code.redirectUri,
        expiresAt: code.expiresAt,
        projectUserId: user.id,
        newUser: user.newUser,
        afterCallbackRedirectUrl: user.afterCallbackRedirectUrl,
        projectId: client.id,
      },
    });

    return {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: enabledScopes,
      client: {
        id: client.id,
        grants: ["authorization_code", "refresh_token"],
      },
      user,
    };
  }

  async getAuthorizationCode(authorizationCode: string): Promise<AuthorizationCode | Falsey> {
    const code = await prismaClient.projectUserAuthorizationCode.findUnique({
      where: {
        authorizationCode,
      },
    });
    if (!code) {
      return false;
    }
    return {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: enabledScopes,
      codeChallenge: code.codeChallenge,
      codeChallengeMethod: code.codeChallengeMethod,
      client: {
        id: code.projectId,
        grants: ["authorization_code", "refresh_token"],
      },
      user: {
        id: code.projectUserId,
        newUser: code.newUser,
        afterCallbackRedirectUrl: code.afterCallbackRedirectUrl,
      },
    };
  }

  async revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
    try {
      const deletedCode = await prismaClient.projectUserAuthorizationCode.delete({
        where: {
          authorizationCode: code.authorizationCode,
        },
      });

      return !!deletedCode;
    } catch (e) {
      if (!(e instanceof PrismaClientKnownRequestError)) {
        throw e;
      }
      return false;
    }
  }

  async validateRedirectUri(redirect_uri: string, client: Client): Promise<boolean> {
    const project = await getProject(client.id);

    if (!project) {
      // This should in theory never happen, make typescript happy
      throw new StackAssertionError("Project not found");
    }

    return validateRedirectUrl(redirect_uri, project.config.domains, project.config.allow_localhost);
  }
}
