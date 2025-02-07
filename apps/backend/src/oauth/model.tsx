import { createMfaRequiredError } from "@/app/api/latest/auth/mfa/sign-in/verification-code-handler";
import { checkApiKeySet } from "@/lib/api-keys";
import { fullProjectInclude, getProject } from "@/lib/projects";
import { validateRedirectUrl } from "@/lib/redirect-urls";
import { getSoleTenancyFromProject } from "@/lib/tenancies";
import { decodeAccessToken, generateAccessToken } from "@/lib/tokens";
import { prismaClient } from "@/prisma-client";
import { AuthorizationCode, AuthorizationCodeModel, Client, Falsey, RefreshToken, Token, User } from "@node-oauth/oauth2-server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { KnownErrors } from "@stackframe/stack-shared";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";

declare module "@node-oauth/oauth2-server" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Client {
    useLegacyGlobalJWT?: boolean,
  }
}

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
  } else if (Array.isArray(scope)){
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
        console.log("no api key");
        return false;
      }
    }

    const project = await getProject(clientId);
    if (!project) {
      return false;
    }

    let redirectUris: string[] = [];
    try {
      redirectUris = project.config.domains.map(
        ({ domain, handler_path }) => new URL(handler_path, domain).toString()
      );
    } catch (e) {
      captureError("get redirect uris", {
        error: e,
        projectId: clientId,
        domains: project.config.domains,
      });
      throw e;
    }

    if (redirectUris.length === 0 && project.config.allow_localhost) {
      redirectUris.push("http://localhost");
    }

    return {
      id: project.id,
      useLegacyGlobalJWT: project.config.legacy_global_jwt_signing,
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
    const tenancy = await getSoleTenancyFromProject(client.id);
    return await generateAccessToken({
      tenancy,
      userId: user.id,
      useLegacyGlobalJWT: client.useLegacyGlobalJWT ?? false,
    });
  }

  async generateRefreshToken(client: Client, user: User, scope: string[]): Promise<string> {
    assertScopeIsValid(scope);

    return generateSecureRandomString();
  }

  async saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
    if (token.refreshToken) {
      const tenancy = await getSoleTenancyFromProject(client.id);
      const projectUser = await prismaClient.projectUser.findUniqueOrThrow({
        where: {
          tenancyId_projectUserId: {
            tenancyId: tenancy.id,
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
          project: tenancy.project,
          branchId: tenancy.branchId,
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
              tenancyId_projectUserId: {
                tenancyId: tenancy.id,
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
    const result = await decodeAccessToken(accessToken);
    if (result.status === "error") {
      captureError("getAccessToken", result.error);
      return false;
    }
    const decoded = result.data;

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
      include: {
        projectUser: {
          include: {
            tenancy: {
              include: {
                project: true,
              },
            },
          },
        },
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
        id: token.projectUser.tenancy.project.id,
        grants: ["authorization_code", "refresh_token"],
      },
      scope: enabledScopes,
    };
  }

  async revokeToken(token: RefreshToken): Promise<boolean> {
    // No refreshToken rotation for now (see Git history for old code)
    return true;
  }

  async verifyScope(token: Token, scope: string[]): Promise<boolean> {
    return checkScope(scope);
  }

  async saveAuthorizationCode(
    code: Pick<AuthorizationCode, 'authorizationCode' | 'expiresAt' | 'redirectUri' | 'scope' | 'codeChallenge' | 'codeChallengeMethod'>,
    client: Client,
    user: User
  ): Promise<AuthorizationCode | Falsey> {
    if (!code.scope) {
      throw new KnownErrors.InvalidScope("<empty string>");
    }
    assertScopeIsValid(code.scope);
    const tenancy = await getSoleTenancyFromProject(client.id);
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
        tenancyId: tenancy.id,
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
      include: {
        projectUser: {
          include: {
            tenancy: {
              include: {
                project: true,
              },
            },
          },
        },
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
        id: code.projectUser.tenancy.project.id,
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
        }
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

    return validateRedirectUrl(
      redirect_uri,
      project.config.domains,
      project.config.allow_localhost,
    );
  }
}
